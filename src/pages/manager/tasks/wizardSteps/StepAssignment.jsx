import React from 'react';
import InternalAssignment from '../assignment/InternalAssignment';
import ServiceAssignment from '../assignment/ServiceAssignment';

const StepAssignment = ({
    formData,
    setFormData,
    areas,
    staff,
    selectedService,
    openStaffGroupDialog,
    openPetGroupDialog
}) => {
    if (formData.type === 'internal') {
        return (
            <InternalAssignment
                formData={formData}
                setFormData={setFormData}
                areas={areas}
                staff={staff}
                openStaffGroupDialog={openStaffGroupDialog}
                openPetGroupDialog={openPetGroupDialog}
            />
        );
    } else {
        return (
            <ServiceAssignment
                formData={formData}
                setFormData={setFormData}
                areas={areas}
                staff={staff}
                selectedService={selectedService}
                openStaffGroupDialog={openStaffGroupDialog}
                openPetGroupDialog={openPetGroupDialog}
            />
        );
    }
};

export default StepAssignment;

