# ReleaseOps invocations

The `releaseops-aura-tests.yml` workflow accepts optional `database_id` and
`correlation_id` inputs. Supply both for a coordinated invocation. The database ID
must be eight hexadecimal characters. The correlation format is
`releaseops-<GitHub run ID>-<attempt>`. The workflow run name is the exact correlation
identifier so callers can recover and cancel their own work after a timeout.

The target URI is constructed within the workflow for devreleaseops. Arbitrary
hosts cannot be supplied. The existing ReleaseOps password secret must match the
password used to create the invocation database. Without either input, manual
callers continue to use the existing URI and password secrets.

Concurrency is per database and does not cancel running tests. Callers must wait
for their exact workflow run to become terminal before removing its database.
