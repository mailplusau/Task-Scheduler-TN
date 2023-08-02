/**
 * @author Tim Nguyen
 * @description NetSuite Experimentation - Task Scheduler - This script will run every 15 minutes.
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @created 25/07/2023
 *
 * This script is to be set as Scheduled script, running as Daily event, repeat every 15 minutes every day and no end date.
 */

import {VARS} from '@/utils/utils.mjs';
import {scheduler} from '@/utils/scheduler.mjs';

let NS_MODULES = {};
const moduleNames = ['render', 'file', 'runtime', 'search', 'record', 'url', 'format', 'email', 'task', 'log', 'https'];

// eslint-disable-next-line no-undef
define(moduleNames.map(item => 'N/' + item), (...args) => {
    for (let [index, moduleName] of moduleNames.entries())
        NS_MODULES[moduleName] = args[index];

    function getInputData() {
        let {search} = NS_MODULES;

        return search.create({
            type: 'customrecord_scheduled_task',
            filters: [
                ['custrecord_scheduled_time', 'before', scheduler.toNSSearchableDatetime(NS_MODULES, new Date())],
                'AND',
                ['custrecord_task_status', 'is', VARS.TASK_STATUS.SCHEDULED]
            ],
            columns: ['internalid']
        });
    }

    // function map(context) {
    // }

    function reduce(context) { // TODO: Add logic for multi-deployment script
        NS_MODULES.log.debug({title: "reduce()", details: `${context.values}`});
        let result = JSON.parse(context.values);
        let taskRecord = NS_MODULES.record.load({
            type: 'customrecord_scheduled_task',
            id: result.values['internalid']?.value || result.values['internalid']
        });

        try {
            taskRecord.setValue({fieldId: 'custrecord_task_status', value: VARS.TASK_STATUS.QUEUED});

            scheduler.dispatchTask(NS_MODULES, {
                taskRecordId: taskRecord.getValue({fieldId: 'id'}),
                taskType: taskRecord.getValue({fieldId: 'custrecord_task_type'}),
                scriptId: taskRecord.getValue({fieldId: 'custrecord_script_id'}),
                deploymentId: taskRecord.getValue({fieldId: 'custrecord_deployment_id'}),
            });

            taskRecord.save();

            context.write({key: context.key, value: taskRecord.getValue({fieldId: 'id'})});
        } catch (e) { NS_MODULES.log.error({title: "reduce()", details: `${e}`}); }
    }

    function summarize(context) {
        let taskCount = 0;
        context.output.iterator().each(() => {
            taskCount++;
            return true;
        });

        NS_MODULES.log.debug({title: "Report", details: `Number of tasks dispatched this period: ${taskCount}`});
    }

    return {
        getInputData,
        // map,
        reduce,
        summarize
    };
});