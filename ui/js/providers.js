/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

treeherder.provider('thServiceDomain', function() {
    this.$get = function() {
        if (window.thServiceDomain) {
            return window.thServiceDomain;
        } else {
            return "";
        }
    };
});

treeherder.provider('thResultStatusList', function() {
    var all = function() {
        return ['success', 'testfailed', 'busted', 'exception', 'retry', 'usercancel', 'running', 'pending', 'coalesced'];
    };

    var defaultFilters = function() {
        return ['success', 'testfailed', 'busted', 'exception', 'retry', 'usercancel', 'running', 'pending'];
    };

    this.$get = function() {
        return {
            all: all,
            defaultFilters: defaultFilters
        };
    };
});

treeherder.provider('thResultStatus', function() {
    this.$get = function() {
        return function(job) {
            if (job.state === "completed") {
                return job.result;
            }
            // Coalesced jobs are marked as pending by the API, this will be fixed by bug 1132546.
            if (job.job_coalesced_to_guid !== null) {
                return 'coalesced';
            }
            return job.state;
        };
    };
});

treeherder.provider('thResultStatusObject', function() {
    var getResultStatusObject = function(){
        return {
            'running':0,
            'pending':0,
            'completed':0
            };
    };

    this.$get = function() {
        return {
            getResultStatusObject:getResultStatusObject
            };
    };
});

treeherder.provider('thResultStatusInfo', function() {
    this.$get = function() {
        return function(resultState) {
            // default if there is no match, used for pending
            var resultStatusInfo = {
                severity: 100,
                btnClass: "btn-default",
                jobButtonIcon: ""
            };

            switch (resultState) {
                case "busted":
                    resultStatusInfo = {
                        severity: 1,
                        btnClass: "btn-red",
                        btnClassClassified: "btn-red-classified",
                        jobButtonIcon: "glyphicon glyphicon-fire",
                        countText: "busted"
                    };
                    break;
                case "exception":
                    resultStatusInfo = {
                        severity: 2,
                        btnClass: "btn-purple",
                        btnClassClassified: "btn-purple-classified",
                        jobButtonIcon: "glyphicon glyphicon-fire",
                        countText: "exception"
                    };
                    break;
                case "testfailed":
                    resultStatusInfo = {
                        severity: 3,
                        btnClass: "btn-orange",
                        btnClassClassified: "btn-orange-classified",
                        jobButtonIcon: "glyphicon glyphicon-warning-sign",
                        countText: "failed"
                    };
                    break;
                case "unknown":
                    resultStatusInfo = {
                        severity: 4,
                        btnClass: "btn-black",
                        btnClassClassified: "btn-black-classified",
                        jobButtonIcon: "",
                        countText: "unknown"
                    };
                    break;
                case "usercancel":
                    resultStatusInfo = {
                        severity: 5,
                        btnClass: "btn-pink",
                        jobButtonIcon: "",
                        countText: "cancel"
                    };
                    break;
                case "retry":
                    resultStatusInfo = {
                        severity: 6,
                        btnClass: "btn-dkblue",
                        jobButtonIcon: "",
                        countText: "retry"
                    };
                    break;
                case "success":
                    resultStatusInfo = {
                        severity: 7,
                        btnClass: "btn-green",
                        jobButtonIcon: "",
                        countText: "success"
                    };
                    break;
                case "running":
                    resultStatusInfo = {
                        severity: 8,
                        btnClass: "btn-dkgray",
                        jobButtonIcon: "",
                        countText: "running"
                    };
                    break;
                case "pending":
                    resultStatusInfo = {
                        severity: 100,
                        btnClass: "btn-ltgray",
                        jobButtonIcon: "",
                        countText: "pending"
                    };
                    break;
                case "coalesced":
                    resultStatusInfo = {
                        severity: 101,
                        btnClass: "btn-yellow",
                        jobButtonIcon: "",
                        countText: "coalesced"
                    };
                    break;
            }

            return resultStatusInfo;
        };

    };
});

/**
 * The set of custom Treeherder events.
 *
 * These are/can be used via $rootScope.$emit.
 */
treeherder.provider('thEvents', function() {
    this.$get = function() {
        return {

            // fired when a list of revisions has been loaded by button-click
            revisionsLoaded: "revisions-loaded-EVT",

            // fired (surprisingly) when a job is clicked
            jobClick: "job-click-EVT",

            // fired when the job details are loaded
            jobDetailLoaded: "job-detail-loaded-EVT",

            // fired with a selected job on ctrl/cmd-click or spacebar
            jobPin: "job-pin-EVT",

            // fired with a selected job on 'r'
            jobRetrigger: "job-retrigger-EVT",

            // fired when the user middle-clicks on a job to view the log
            jobContextMenu: "job-context-menu-EVT",

            // fired when jobs are classified locally
            jobsClassified: "jobs-classified-EVT",

            // fired when bugs are associated to jobs locally
            bugsAssociated: "bugs-associated-EVT",

            // after loading a group of jobs
            jobsLoaded: "jobs-loaded-EVT",

            // after deselecting a job via click outside/esc
            clearSelectedJob: "clear-selected-job-EVT",

            // fired when a global filter has changed
            globalFilterChanged: "status-filter-changed-EVT",

            toggleRevisions: "toggle-revisions-EVT",

            toggleAllRevisions: "toggle-all-revisions-EVT",

            toggleUnclassifiedFailures: "toggle-unclassified-failures-EVT",

            changeSelection: "next-previous-job-EVT",

            addRelatedBug: "add-related-bug-EVT",

            saveClassification: "save-classification-EVT",

            deleteClassification: "delete-classification-EVT",

            clearPinboard: "clear-pinboard-EVT",

            searchPage: "search-page-EVT",

            selectJob: "select-job-EVT",

            mapResultSetJobs: "map-result-set-jobs-EVT",

            applyNewJobs: "apply-new-jobs-EVT",

            initSheriffPanel: "init-sheriff-panel-EVT",

            openLogviewer: "open-logviewer-EVT"
        };
    };
});

treeherder.provider('thAggregateIds', function() {

    var escape = function(id) {
        return id.replace(/(:|\[|\]|\?|,|\.|\s+)/g, '-');
    };

    var getPlatformRowId = function(
        repoName, resultsetId, platformName, platformOptions) {
        // ensure there are no invalid characters in the id (like spaces, etc)
        return escape(repoName +
                      resultsetId +
                      platformName +
                      platformOptions);
    };

    var getResultsetTableId = function(repoName, resultsetId, revision){
        return escape(repoName + resultsetId + revision);
    };

    this.$get = function() {
        return {
            getPlatformRowId:getPlatformRowId,
            getResultsetTableId:getResultsetTableId
            };
    };
});

treeherder.provider('thReftestStatus', function() {
    this.$get = function() {
        return function(job) {
            if (job.job_group_name) {
                return (job.job_group_name.toLowerCase().indexOf('reftest') !== -1);
            }
        };
    };
});
