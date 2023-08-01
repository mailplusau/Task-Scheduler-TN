/**
 * @author Tim Nguyen
 * @description NetSuite Experimentation - Task Scheduler
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @created 25/07/2023
 */

import {VARS} from '@/utils/utils.mjs';
import {scheduler} from '@/utils/scheduler.mjs';

// This should be the same file as the one built by webpack. Make sure this matches the filename in package.json
let htmlTemplateFile = 'mp_cl_task_scheduler_tn_v2_vue.html';
const clientScriptFilename = 'mp_cl_task_scheduler_tn_v2_vue.js';
const defaultTitle = 'Task Scheduler';

let NS_MODULES = {};


define(['N/ui/serverWidget', 'N/render', 'N/search', 'N/file', 'N/log', 'N/record', 'N/email', 'N/runtime', 'N/https', 'N/task', 'N/format', 'N/url'],
    (serverWidget, render, search, file, log, record, email, runtime, https, task, format, url) => {
    NS_MODULES = {serverWidget, render, search, file, log, record, email, runtime, https, task, format, url};
    
    const onRequest = ({request, response}) => {
        if (request.method === "GET") {

            if (!_handleGETRequests(request.parameters['requestData'], response)){
                // Render the page using either inline form or standalone page
                // _getStandalonePage(response)
                _getInlineForm(response)
            }

        } else if (request.method === "POST") { // Request method should be POST (?)
            _handlePOSTRequests(JSON.parse(request.body), response);
            // _writeResponseJson(response, {test: 'test response from post', params: request.parameters, body: request.body});
        } else {
            log.debug({
                title: "request method type",
                details: `method : ${request.method}`,
            });
        }

    };

    return {onRequest};
});

// We use the form to load the Client Script.
function _getInlineForm(response) {
    let {serverWidget} = NS_MODULES;
    
    // Create a NetSuite form
    let form = serverWidget.createForm({ title: defaultTitle });

    // Retrieve client script ID using its file name.
    form.clientScriptFileId = _getHtmlTemplate(clientScriptFilename)[clientScriptFilename].id;

    response.writePage(form);
}

// Search for the ID and URL of a given file name inside the NetSuite file cabinet
function _getHtmlTemplate(htmlPageName) {
    let {search} = NS_MODULES;

    const htmlPageData = {};

    search.create({
        type: 'file',
        filters: ['name', 'is', htmlPageName],
        columns: ['name', 'url']
    }).run().each(resultSet => {
        htmlPageData[resultSet.getValue({ name: 'name' })] = {
            url: resultSet.getValue({ name: 'url' }),
            id: resultSet.id
        };
        return true;
    });

    return htmlPageData;
}


function _handleGETRequests(request, response) {
    if (!request) return false;

    let {log} = NS_MODULES;

    try {
        let {operation, requestParams} = JSON.parse(request);

        if (!operation) throw 'No operation specified.';

        if (operation === 'getIframeContents') _getIframeContents(response);
        else if (!getOperations[operation]) throw `GET operation [${operation}] is not supported.`;
        else getOperations[operation](response, requestParams);
    } catch (e) {
        log.debug({title: "_handleGETRequests", details: `error: ${e}`});
        _writeResponseJson(response, {error: `${e}`})
    }

    return true;
}

function _handlePOSTRequests({operation, requestParams}, response) {
    let {log} = NS_MODULES;

    try {
        if (!operation) throw 'No operation specified.';

        // _writeResponseJson(response, {source: '_handlePOSTRequests', operation, requestParams});
        if (!postOperations[operation]) throw `POST operation [${operation}] is not supported.`;
        else postOperations[operation](response, requestParams);
    } catch (e) {
        log.debug({title: "_handlePOSTRequests", details: `error: ${e}`});
        _writeResponseJson(response, {error: `${e}`})
    }
}

function _writeResponseJson(response, body) {
    response.write({ output: JSON.stringify(body) });
    response.addHeader({
        name: 'Content-Type',
        value: 'application/json; charset=utf-8'
    });
}

function _getIframeContents(response) {
    let {file} = NS_MODULES;
    const htmlFileData = _getHtmlTemplate(htmlTemplateFile);
    const htmlFile = file.load({ id: htmlFileData[htmlTemplateFile].id });

    _writeResponseJson(response, htmlFile.getContents());
}

const getOperations = {

};

const postOperations = {
    'scheduleSingleTask' : function (response, {scheduledTime, employeeId, scriptId, deploymentId, taskType, taskParameters}) {
        let {record} = NS_MODULES;

        if (!VARS.TASK_TYPE[taskType])
            return _writeResponseJson(response, {error: `Task type [${taskType}] not supported.`});

        let taskRecord = record.create({type: 'customrecord_scheduled_task'});
        taskRecord.setValue({fieldId: 'name', value: 'Scheduled Task'});
        taskRecord.setValue({fieldId: 'custrecord_scheduled_time', value: new Date(scheduledTime)});
        taskRecord.setValue({fieldId: 'custrecord_task_initiator', value: employeeId});
        taskRecord.setValue({fieldId: 'custrecord_script_id', value: scriptId});
        taskRecord.setValue({fieldId: 'custrecord_deployment_id', value: deploymentId});
        taskRecord.setValue({fieldId: 'custrecord_task_type', value: taskType});
        taskRecord.setValue({fieldId: 'custrecord_task_status', value: VARS.TASK_STATUS.SCHEDULED});
        taskRecord.setValue({fieldId: 'custrecord_task_parameters', value: JSON.stringify(taskParameters)});
        let taskRecordId = taskRecord.save();

        _writeResponseJson(response, `Scheduled Task Created with ID: ${taskRecordId}`);
    },
    'dispatchSingleTask' : function (response, {employeeId, scriptId, deploymentId, taskType, taskParameters}) {
        if (!VARS.TASK_TYPE[taskType])
            return _writeResponseJson(response, {error: `Task type [${taskType}] not supported.`});

        let taskRecord = NS_MODULES.record.create({type: 'customrecord_scheduled_task'});
        taskRecord.setValue({fieldId: 'name', value: 'Scheduled Task'});
        taskRecord.setValue({fieldId: 'custrecord_task_initiator', value: employeeId});
        taskRecord.setValue({fieldId: 'custrecord_script_id', value: scriptId});
        taskRecord.setValue({fieldId: 'custrecord_deployment_id', value: deploymentId});
        taskRecord.setValue({fieldId: 'custrecord_task_type', value: taskType});
        taskRecord.setValue({fieldId: 'custrecord_task_status', value: VARS.TASK_STATUS.STARTING});
        taskRecord.setValue({fieldId: 'custrecord_task_parameters', value: JSON.stringify(taskParameters)});
        let taskRecordId = taskRecord.save();

        scheduler.dispatchTask(NS_MODULES,
            {taskRecordId, taskType, scriptId, deploymentId});

        _writeResponseJson(response, `Dispatched task ID ${taskRecordId}`);
    }
};