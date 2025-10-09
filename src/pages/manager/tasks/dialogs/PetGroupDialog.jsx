import React from 'react';
import { Dialog, DialogContent, DialogActions, Typography, FormGroup, FormControlLabel, Checkbox, Button } from '@mui/material';

const PetGroupDialog = ({
    open,
    onClose,
    petGroupNames,
    petGroupsMap,
    petGroupContext,
    formData,
    togglePetGroup
}) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Chọn nhóm pet</Typography>
                <FormGroup>
                    {petGroupNames.map(groupName => {
                        const isSelected = petGroupContext === 'internal'
                            ? formData.internalAssignment.petGroups.some(pg => pg.groupName === groupName)
                            : petGroupContext?.timeSlot
                                ? (formData.timeSlotAssignments[petGroupContext.timeSlot]?.petGroups || []).some(pg => pg.groupName === groupName)
                                : false;

                        return (
                            <FormControlLabel
                                key={groupName}
                                control={
                                    <Checkbox
                                        checked={isSelected}
                                        onChange={() => togglePetGroup(groupName)}
                                    />
                                }
                                label={`${groupName} (${petGroupsMap[groupName].length} con)`}
                            />
                        );
                    })}
                </FormGroup>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Đóng</Button>
            </DialogActions>
        </Dialog>
    );
};

export default PetGroupDialog;

