const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");

let _client;

module.exports.getSecret = async function (project, name) {
    if (!_client) {
        console.log("Creating new Secret Manager client");
        _client = new SecretManagerServiceClient();
    }

    const [accessSecretResponse] = await _client.accessSecretVersion({
        name: `projects/${project}/secrets/${name}/versions/latest`,
    });

    return accessSecretResponse.payload.data.toString("utf8");
};
