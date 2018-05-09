// Chris Belfield
// Syncronising of Grafana for AWS ECS services

const AWS = require('aws-sdk');
const axios = require('axios');
let mustache = require('mustache');
let fs = require('fs');
var _ = require('lodash');
helpers = require('helpers.js');

async function syncDashboard(serviceId, clusterId) {
    // check if dashboard exists
    var config = {
        headers: {
            'Authorization': "Bearer " + process.env.GF_API_KEY,
            'Content-Type': "application/json"
        }
    };
    axios.get(process.env.GF_API_URL + "/api/search?query=" + serviceId, config)
        .then(response => {
            // Add dashboard if service not found
            if (response.data.length == 0) {
                var render = { cluster: clusterId, service: serviceId };
                fs.readFile('./templates/grafana.json', 'utf8', function (err, data) {
                    request = mustache.render(data.toString(), render);
                    axios.post(process.env.GF_API_URL + "/api/dashboards/db/", request, config);
                });
            }
        });
}

function cleanup(ecs_services) {
    var config = {
        headers: {
            'Authorization': "Bearer " + process.env.GF_API_KEY,
            'Content-Type': "application/json"
        }
    };
    // Returns all dashboards
    axios
        .get(process.env.GF_API_URL + "/api/search/", config)
        .then(response => {
            for (dashboard of response.data) {
                if (_.includes(ecs_services, dashboard.title) == false) {
                    axios.delete(process.env.GF_API_URL + "/api/dashboards/uid/" + dashboard.uid, config);
                    // removed from grafana
                }
            }
        });
}

exports.handler = async function (event, context, callback) {
    const ECS = new AWS.ECS();

    try {
        var clusters = await ECS.listClusters().promise();
        clusters = helpers.stripArns(clusters.clusterArns);

        const all_services = [];

        for (clusterId of clusters) {
            var params = { cluster: clusterId };
            var data = await ECS.listServices(params).promise();
            var services = helpers.stripArns(data.serviceArns);
            if (services.length != 0) {
                for (serviceId of services) {
                    await syncDashboard(serviceId, clusterId);
                    all_services.push(serviceId);
                }
            }
        }
        cleanup(all_services);

        callback(null, 'Sync complete!');
    } catch (err) {
        callback(err.message);
    }
};                                                         