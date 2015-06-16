# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, you can obtain one at http://mozilla.org/MPL/2.0/.

web: newrelic-admin run-program gunicorn treeherder.webapp.wsgi:application --log-file - --timeout 29 --max-requests 2000
worker_beat: newrelic-admin run-program celery -A treeherder beat
worker_pushlog: newrelic-admin run-program celery -A treeherder worker -Q pushlog,fetch_missing_push_logs --maxtasksperchild=500 --concurrency=5
worker_buildapi_pending: newrelic-admin run-program celery -A treeherder worker -Q buildapi_pending --maxtasksperchild=20 --concurrency=5
worker_buildapi_running: newrelic-admin run-program celery -A treeherder worker -Q buildapi_running --maxtasksperchild=20 --concurrency=5
worker_buildapi_4hr_1: newrelic-admin run-program celery -A treeherder worker -Q buildapi_4hr --maxtasksperchild=20
worker_buildapi_4hr_2: newrelic-admin run-program celery -A treeherder worker -Q buildapi_4hr --maxtasksperchild=20
worker_default: newrelic-admin run-program celery -A treeherder worker -Q default,process_objects,cycle_data,calculate_eta,populate_performance_series,fetch_bugs --maxtasksperchild=50 --concurrency=3
worker_hp: newrelic-admin run-program celery -A treeherder worker -Q classification_mirroring,publish_to_pulse --maxtasksperchild=50 --concurrency=1
worker_log_parser: newrelic-admin run-program celery -A treeherder worker -Q log_parser_fail,log_parser,log_parser_hp,log_parser_json --maxtasksperchild=50 --concurrency=5
