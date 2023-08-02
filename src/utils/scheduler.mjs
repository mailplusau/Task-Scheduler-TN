export const scheduler = {
    toNSSearchableDatetime : (NS_MODULES, date) => {
        let formatted = NS_MODULES.format.format({ value: date, type: NS_MODULES.format.Type.DATETIMETZ });

        return formatted.replace(/(:\d{2}):\d{1,2}\b/, "$1");
    },
    dispatchTask : (NS_MODULES, {taskRecordId, taskType, scriptId, deploymentId}) => {
        try {
            let params = {};
            params[`custscript_${scriptId}_task_record_id`] = taskRecordId;

            let scriptTask = NS_MODULES.task.create({taskType, scriptId, deploymentId, params});
            scriptTask.submit();
        } catch (e) { NS_MODULES.debug.error({title: 'Error dispatching task', details: `The task will be queued instead. ${e}`}); }
    }
};