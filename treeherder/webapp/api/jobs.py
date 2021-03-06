# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import detail_route, list_route
from rest_framework.reverse import reverse
from rest_framework.permissions import IsAuthenticated

from treeherder.webapp.api.permissions import (IsStaffOrReadOnly)
from treeherder.webapp.api.utils import (UrlQueryFilter, with_jobs, get_option)
from treeherder.webapp.api import permissions
from treeherder.model.derived import ArtifactsModel


class JobsViewSet(viewsets.ViewSet):

    """
    This viewset is responsible for the jobs endpoint.

    """
    throttle_scope = 'jobs'
    permission_classes = (permissions.HasLegacyOauthPermissionsOrReadOnly,)

    @with_jobs
    def retrieve(self, request, project, jm, pk=None):
        """
        GET method implementation for detail view

        Return a single job with log_references and
        artifact names and links to the artifact blobs.
        """
        obj = jm.get_job(pk)
        if obj:
            job = obj[0]
            job["resource_uri"] = reverse("jobs-detail",
                                          kwargs={"project": jm.project, "pk": job["id"]})
            job["logs"] = jm.get_log_references(pk)

            # make artifact ids into uris

            with ArtifactsModel(project) as artifacts_model:
                artifact_refs = artifacts_model.get_job_artifact_references(pk)
            job["artifacts"] = []
            for art in artifact_refs:
                ref = reverse("artifact-detail",
                              kwargs={"project": jm.project, "pk": art["id"]})
                art["resource_uri"] = ref
                job["artifacts"].append(art)

            option_collections = jm.refdata_model.get_all_option_collections()
            job["platform_option"] = get_option(job, option_collections)

            return Response(job)
        else:
            return Response("No job with id: {0}".format(pk), 404)

    @with_jobs
    def list(self, request, project, jm):
        """
        GET method implementation for list view
        Optional paramters (default):
        - offset (0)
        - count (10)
        - return_type (dict)
        """
        filter = UrlQueryFilter(request.QUERY_PARAMS)

        offset = int(filter.pop("offset", 0))
        count = min(int(filter.pop("count", 10)), 2000)
        return_type = filter.pop("return_type", "dict").lower()
        exclusion_profile = filter.pop("exclusion_profile", "default")
        visibility = filter.pop("visibility", "included")
        if exclusion_profile in ('false', 'null'):
            exclusion_profile = None
        results = jm.get_job_list(offset, count, conditions=filter.conditions,
                                  exclusion_profile=exclusion_profile,
                                  visibility=visibility)

        if results:
            option_collections = jm.refdata_model.get_all_option_collections()
            for job in results:
                job["platform_option"] = get_option(job, option_collections)

        response_body = dict(meta={"repository": project}, results=[])

        if results and return_type == "list":
            response_body["job_property_names"] = results[0].keys()
            results = [job.values() for job in results]
        response_body["results"] = results
        response_body["meta"].update(offset=offset, count=count)

        return Response(response_body)

    @detail_route(methods=['post'])
    @with_jobs
    def update_state(self, request, project, jm, pk=None):
        """
        Change the state of a job.
        """
        state = request.DATA.get('state', None)

        # check that this state is valid
        if state not in jm.STATES:
            return Response(
                {"message": ("'{0}' is not a valid state.  Must be "
                             "one of: {1}".format(
                                 state,
                                 ", ".join(jm.STATES)
                             ))},
                status=400,
            )

        if not pk:  # pragma nocover
            return Response({"message": "job id required"}, status=400)

        obj = jm.get_job(pk)
        if obj:
            jm.set_state(pk, state)
            return Response({"message": "state updated to '{0}'".format(state)})
        else:
            return Response("No job with id: {0}".format(pk), 404)

    @detail_route(methods=['post'], permission_classes=[IsAuthenticated])
    @with_jobs
    def cancel(self, request, project, jm, pk=None):
        """
        Change the state of a job.
        """
        job = jm.get_job(pk)
        if job:
            jm.cancel_job(request.user.email, job[0])
            return Response({"message": "canceled job '{0}'".format(job[0]['job_guid'])})
        else:
            return Response("No job with id: {0}".format(pk), 404)

    @list_route(methods=['post'], permission_classes=[IsAuthenticated])
    @with_jobs
    def retrigger(self, request, project, jm):
        """
        Issue a "retrigger" to the underlying build_system_type by scheduling a
        pulse message.
        """
        job_id_list = request.data["job_id_list"]
        for pk in job_id_list:
            job = jm.get_job(pk)
            if job:
                jm.retrigger(request.user.email, job[0])
                return Response({"message": "retriggered job '{0}'".format(job[0]['job_guid'])})
            else:
                return Response("No job with id: {0}".format(pk), 404)

    @detail_route(methods=['post'], permission_classes=[IsStaffOrReadOnly])
    @with_jobs
    def backfill(self, request, project, jm, pk=None):
        """
        Issue a "backfill" to the underlying build_system_type by scheduling a
        pulse message.
        """
        job = jm.get_job(pk)
        if job:
            jm.backfill(request.user.email, job[0])
            return Response({"message": "backfilled job '{0}'".format(job[0]['job_guid'])})
        else:
            return Response("No job with id: {0}".format(pk), 404)

    @with_jobs
    def create(self, request, project, jm):
        """
        This method adds a job to a given resultset.
        """
        jm.store_job_data(request.DATA)

        return Response({'message': 'Job successfully updated'})
