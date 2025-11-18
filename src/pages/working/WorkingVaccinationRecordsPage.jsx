import React, { useEffect, useState, useMemo } from 'react';
import { Box, Paper, Typography, Stack, TextField, MenuItem, Chip, Button, Table, TableHead, TableBody, TableRow, TableCell, Alert, Snackbar, Skeleton, Avatar, Divider, TableContainer, IconButton, Tooltip, Card, CardContent, FormControl, InputLabel, Select, alpha } from '@mui/material';
import { Vaccines, Add, Edit, Pets, Search } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import { getAllVaccinationRecords, createVaccinationRecord, updateVaccinationRecord } from '../../api/vaccinationRecordsApi';
import { getAllPets } from '../../api/petsApi';
import { getAllVaccineTypes } from '../../api/vaccineTypesApi';
import { getAllVaccinationSchedules } from '../../api/vaccinationSchedulesApi';
import { getAllSpecies } from '../../api/petSpeciesApi';
import VaccinationRecordModal from '../../components/modals/VaccinationRecordModal';

const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const WorkingVaccinationRecordsPage = () => {
    const [records, setRecords] = useState([]);
    const [pets, setPets] = useState([]);
    const [vaccineTypes, setVaccineTypes] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [species, setSpecies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPetFilter, setSelectedPetFilter] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load initial data
    useEffect(() => {
        let mounted = true;
        const loadData = async () => {
            try {
                setLoading(true);
                const [recordsRes, petsRes, vaccineTypesRes, schedulesRes, speciesRes] = await Promise.allSettled([
                    getAllVaccinationRecords({ page_index: 0, page_size: 1000 }),
                    getAllPets({ page_index: 0, page_size: 1000 }),
                    getAllVaccineTypes({ page_index: 0, page_size: 1000 }),
                    getAllVaccinationSchedules({ page_index: 0, page_size: 1000 }),
                    getAllSpecies({ page_index: 0, page_size: 1000 })
                ]);

                if (mounted) {
                    setRecords(recordsRes.status === 'fulfilled' ? (recordsRes.value.data || []) : []);
                    setPets(petsRes.status === 'fulfilled' ? (petsRes.value.data || []) : []);
                    setVaccineTypes(vaccineTypesRes.status === 'fulfilled' ? (vaccineTypesRes.value.data || []) : []);
                    setSchedules(schedulesRes.status === 'fulfilled' ? (schedulesRes.value.data || []) : []);
                    setSpecies(speciesRes.status === 'fulfilled' ? (speciesRes.value.data || []) : []);
                }
            } catch (error) {
                console.error('Failed to load data', error);
                if (mounted) {
                    setSnackbar({ message: 'Không thể tải dữ liệu', severity: 'error' });
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };
        loadData();
        return () => { mounted = false; };
    }, []);

    // Filter records
    const filteredRecords = useMemo(() => {
        let filtered = records;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(record => {
                const petName = record.pet?.name || '';
                const vaccineName = record.vaccine_type?.name || '';
                const veterinarian = record.veterinarian || '';
                const clinicName = record.clinic_name || '';
                return (
                    petName.toLowerCase().includes(term) ||
                    vaccineName.toLowerCase().includes(term) ||
                    veterinarian.toLowerCase().includes(term) ||
                    clinicName.toLowerCase().includes(term)
                );
            });
        }

        if (selectedPetFilter) {
            filtered = filtered.filter(record => record.pet_id === selectedPetFilter);
        }

        return filtered;
    }, [records, searchTerm, selectedPetFilter]);

    // Get pet name helper
    const getPetName = (petId) => {
        const pet = pets.find(p => p.id === petId);
        return pet?.name || 'N/A';
    };

    // Get vaccine type name helper
    const getVaccineTypeName = (vaccineTypeId) => {
        const vaccineType = vaccineTypes.find(vt => vt.id === vaccineTypeId);
        return vaccineType?.name || 'N/A';
    };

    // Handle open dialog for create
    const handleOpenCreateDialog = () => {
        setEditMode(false);
        setCurrentRecord(null);
        setDialogOpen(true);
    };

    // Handle open dialog for edit
    const handleOpenEditDialog = (record) => {
        setEditMode(true);
        setCurrentRecord(record);
        setDialogOpen(true);
    };

    // Handle close dialog
    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditMode(false);
        setCurrentRecord(null);
        setIsSubmitting(false);
    };

    // Handle form submit from modal
    const handleSubmit = async (formData) => {
        try {
            setIsSubmitting(true);
            let response;
            if (editMode && currentRecord) {
                response = await updateVaccinationRecord(currentRecord.id, formData);
            } else {
                response = await createVaccinationRecord(formData);
            }

            if (response.success) {
                setSnackbar({ message: response.message || 'Thành công', severity: 'success' });
                handleCloseDialog();

                // Reload records
                const recordsRes = await getAllVaccinationRecords({ page_index: 0, page_size: 1000 });
                setRecords(recordsRes.data || []);
            }
        } catch (error) {
            console.error('Failed to save vaccination record', error);
            setSnackbar({ message: error.message || 'Không thể lưu hồ sơ tiêm phòng', severity: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: COLORS.BACKGROUND.NEUTRAL, minHeight: '100vh' }}>
            <Stack spacing={4}>
                {/* Header */}
                <Box>
                    <Stack direction="row" spacing={2.5} alignItems="flex-start">
                        <Avatar
                            sx={{
                                bgcolor: COLORS.INFO[500],
                                width: 56,
                                height: 56,
                                boxShadow: `0 4px 12px ${alpha(COLORS.INFO[500], 0.3)}`
                            }}
                        >
                            <Vaccines sx={{ fontSize: 28 }} />
                        </Avatar>
                        <Box flex={1}>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.TEXT.PRIMARY, mb: 1 }}>
                                Hồ sơ tiêm phòng
                            </Typography>
                            <Typography variant="body1" sx={{ color: COLORS.TEXT.SECONDARY, lineHeight: 1.6 }}>
                                Quản lý và cập nhật hồ sơ tiêm phòng cho thú cưng
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<Add />}
                            onClick={handleOpenCreateDialog}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 3,
                                py: 1.5,
                                boxShadow: `0 4px 12px ${alpha(COLORS.PRIMARY[500], 0.3)}`
                            }}
                        >
                            Tạo mới
                        </Button>
                    </Stack>
                </Box>

                {/* Filters */}
                <Card
                    sx={{
                        borderRadius: 3,
                        boxShadow: `0px 4px 16px ${alpha(COLORS.SHADOW.LIGHT, 0.08)}`,
                        border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}`
                    }}
                >
                    <CardContent sx={{ p: 3 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}>
                            <TextField
                                fullWidth
                                placeholder="Tìm kiếm theo tên thú cưng, loại vaccine, bác sĩ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: <Search sx={{ mr: 1, color: COLORS.TEXT.SECONDARY }} />
                                }}
                                sx={{ flex: 1 }}
                            />
                            <FormControl sx={{ minWidth: 200 }}>
                                <InputLabel>Lọc theo thú cưng</InputLabel>
                                <Select
                                    value={selectedPetFilter}
                                    onChange={(e) => setSelectedPetFilter(e.target.value)}
                                    label="Lọc theo thú cưng"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    {pets.map((pet) => (
                                        <MenuItem key={pet.id} value={pet.id}>
                                            {pet.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Records Table */}
                {loading ? (
                    <Stack spacing={2}>
                        {Array.from({ length: 3 }).map((_, idx) => (
                            <Skeleton key={idx} variant="rounded" height={100} sx={{ borderRadius: 2 }} />
                        ))}
                    </Stack>
                ) : filteredRecords.length === 0 ? (
                    <Card
                        sx={{
                            borderRadius: 3,
                            boxShadow: `0px 4px 16px ${alpha(COLORS.SHADOW.LIGHT, 0.08)}`,
                            border: `1px dashed ${alpha(COLORS.BORDER.DEFAULT, 0.3)}`
                        }}
                    >
                        <CardContent sx={{ p: 8, textAlign: 'center' }}>
                            <Vaccines sx={{ fontSize: 80, color: COLORS.TEXT.SECONDARY, mb: 3, opacity: 0.3 }} />
                            <Typography variant="h6" sx={{ color: COLORS.TEXT.SECONDARY, mb: 1.5, fontWeight: 600 }}>
                                Chưa có hồ sơ tiêm phòng
                            </Typography>
                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                {searchTerm || selectedPetFilter
                                    ? 'Không tìm thấy hồ sơ phù hợp với bộ lọc.'
                                    : 'Bắt đầu bằng cách tạo hồ sơ tiêm phòng mới cho thú cưng.'}
                            </Typography>
                        </CardContent>
                    </Card>
                ) : (
                    <TableContainer
                        component={Paper}
                        sx={{
                            borderRadius: 3,
                            boxShadow: `0px 4px 16px ${alpha(COLORS.SHADOW.LIGHT, 0.08)}`,
                            border: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.2)}`
                        }}
                    >
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800, bgcolor: COLORS.INFO[50], py: 2.5 }}>
                                        Thú cưng
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, bgcolor: COLORS.INFO[50], py: 2.5 }}>
                                        Loại vaccine
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, bgcolor: COLORS.INFO[50], py: 2.5 }}>
                                        Ngày tiêm
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, bgcolor: COLORS.INFO[50], py: 2.5 }}>
                                        Ngày tiêm tiếp theo
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, bgcolor: COLORS.INFO[50], py: 2.5 }}>
                                        Bác sĩ thú y
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, bgcolor: COLORS.INFO[50], py: 2.5 }}>
                                        Phòng khám
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, bgcolor: COLORS.INFO[50], py: 2.5 }}>
                                        Số lô
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 800, bgcolor: COLORS.INFO[50], py: 2.5 }}>
                                        Thao tác
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRecords.map((record) => (
                                    <TableRow key={record.id} hover>
                                        <TableCell>
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <Avatar
                                                    src={record.pet?.avatar_url || record.pet?.image_url}
                                                    sx={{ width: 40, height: 40 }}
                                                >
                                                    <Pets />
                                                </Avatar>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {getPetName(record.pet_id)}
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {getVaccineTypeName(record.vaccine_type_id)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {formatDateTime(record.vaccination_date)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {formatDateTime(record.next_due_date)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {record.veterinarian || '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {record.clinic_name || '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {record.batch_number || '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Chỉnh sửa" arrow>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenEditDialog(record)}
                                                    sx={{
                                                        color: COLORS.INFO[600],
                                                        '&:hover': { bgcolor: alpha(COLORS.INFO[50], 0.8) }
                                                    }}
                                                >
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Vaccination Record Modal */}
                <VaccinationRecordModal
                    isOpen={dialogOpen}
                    onClose={handleCloseDialog}
                    onSubmit={handleSubmit}
                    editMode={editMode}
                    initialData={currentRecord}
                    pets={pets}
                    vaccineTypes={vaccineTypes}
                    schedules={schedules}
                    species={species}
                    isLoading={isSubmitting}
                />

                <Snackbar
                    open={Boolean(snackbar)}
                    autoHideDuration={3500}
                    onClose={() => setSnackbar(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    {snackbar && <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>}
                </Snackbar>
            </Stack>
        </Box>
    );
};

export default WorkingVaccinationRecordsPage;

