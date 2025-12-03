import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Paper, Stack, Avatar, Chip, Divider, Grid, IconButton, alpha } from '@mui/material';
import { Close, Pets as PetsIcon, Vaccines, HealthAndSafety, MonitorHeart, CalendarToday, Event, Person, LocalHospital, Inventory, Description, Thermostat, Warning } from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import Loading from '../loading/Loading';

const ViewPetDetailsModal = ({
    isOpen,
    onClose,
    pet,
    vaccinations = [],
    healthRecords = [],
    species = [],
    breeds = [],
    groups = [],
    isLoading = false
}) => {
    // Get species name by ID
    const getSpeciesName = (speciesId) => {
        const sp = species.find(s => s.id === speciesId);
        return sp ? sp.name : '—';
    };

    // Get breed name by ID
    const getBreedName = (breedId) => {
        const br = breeds.find(b => b.id === breedId);
        return br ? br.name : '—';
    };

    // Get health status info (label and colors) - synchronized with PetsTab
    const getHealthStatusInfo = (healthStatus) => {
        const status = (healthStatus || 'HEALTHY').toUpperCase();

        const statusMap = {
            // Khỏe mạnh – xanh lá
            'HEALTHY': {
                label: 'Khỏe mạnh',
                color: COLORS.SUCCESS,
                bg: COLORS.SUCCESS[100]
            },
            // Ốm – đỏ
            'SICK': {
                label: 'Ốm',
                color: COLORS.ERROR,
                bg: COLORS.ERROR[100]
            },
            // Đang hồi phục – cam (WARNING)
            'RECOVERING': {
                label: 'Đang hồi phục',
                color: COLORS.WARNING,
                bg: COLORS.WARNING[100]
            },
            // Đang theo dõi – xanh dương (INFO)
            'UNDER_OBSERVATION': {
                label: 'Đang theo dõi',
                color: COLORS.INFO,
                bg: COLORS.INFO[100]
            },
            // Cách ly – xám (SECONDARY)
            'QUARANTINE': {
                label: 'Cách ly',
                color: COLORS.SECONDARY,
                bg: COLORS.SECONDARY[100]
            }
        };

        return statusMap[status] || statusMap['HEALTHY'];
    };

    if (!pet) return null;

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            disableScrollLock
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: `0 20px 60px ${alpha(COLORS.SHADOW.DARK, 0.3)}`,
                    maxHeight: '90vh'
                }
            }}
        >
            <Box
                sx={{
                    background: `linear-gradient(135deg, ${alpha(COLORS.ERROR[50], 0.3)}, ${alpha(COLORS.SECONDARY[50], 0.2)})`,
                    borderBottom: `3px solid ${COLORS.ERROR[500]}`
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: COLORS.ERROR[700], pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PetsIcon />
                    🐾 Chi tiết thú cưng: {pet.name}
                </DialogTitle>
            </Box>
            <DialogContent sx={{ pt: 3, pb: 2, px: 3, overflow: 'auto' }}>
                {isLoading ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Loading message="Đang tải thông tin..." />
                    </Box>
                ) : (
                    <Stack spacing={3}>
                        {/* Basic Information - Centered */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                background: alpha(COLORS.ERROR[50], 0.3),
                                border: `2px solid ${alpha(COLORS.ERROR[200], 0.4)}`
                            }}
                        >
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Avatar
                                    src={pet.image || pet.image_url}
                                    alt={pet.name}
                                    sx={{
                                        width: 120,
                                        height: 120,
                                        margin: '0 auto',
                                        border: `3px solid ${COLORS.ERROR[300]}`,
                                        boxShadow: `0 4px 12px ${alpha(COLORS.ERROR[500], 0.2)}`,
                                        mb: 2
                                    }}
                                >
                                    <PetsIcon />
                                </Avatar>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.ERROR[700], mb: 2 }}>
                                    {pet.name}
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            <Grid container spacing={2} justifyContent="center">
                                <Grid item xs={12} sm={6} md={4}>
                                    <Stack spacing={1.5}>
                                        <Stack direction="row" spacing={2} justifyContent="space-between">
                                            <Typography sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Loài:</Typography>
                                            <Typography sx={{ fontWeight: 600 }}>{getSpeciesName(pet.species_id)}</Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={2} justifyContent="space-between">
                                            <Typography sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Giống:</Typography>
                                            <Typography sx={{ fontWeight: 600 }}>{getBreedName(pet.breed_id)}</Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={2} justifyContent="space-between">
                                            <Typography sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Tuổi:</Typography>
                                            <Typography sx={{ fontWeight: 600 }}>{pet.age} tuổi</Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={2} justifyContent="space-between">
                                            <Typography sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Cân nặng:</Typography>
                                            <Typography sx={{ fontWeight: 600 }}>{pet.weight} kg</Typography>
                                        </Stack>
                                    </Stack>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Stack spacing={1.5}>
                                        <Stack direction="row" spacing={2} justifyContent="space-between">
                                            <Typography sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Giới tính:</Typography>
                                            <Typography sx={{ fontWeight: 600 }}>
                                                {pet.gender === 'Male' ? '♂️ Đực' : '♀️ Cái'}
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={2} justifyContent="space-between">
                                            <Typography sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Màu sắc:</Typography>
                                            <Typography sx={{ fontWeight: 600 }}>{pet.color}</Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={2} justifyContent="space-between">
                                            <Typography sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Ngày đến quán:</Typography>
                                            <Typography sx={{ fontWeight: 600 }}>
                                                {pet.arrival_date ? new Date(pet.arrival_date).toLocaleDateString('vi-VN') : '—'}
                                            </Typography>
                                        </Stack>
                                        {pet.group_id && (
                                            <Stack direction="row" spacing={2} justifyContent="space-between">
                                                <Typography sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>Nhóm:</Typography>
                                                <Typography sx={{ fontWeight: 600 }}>
                                                    {groups.find(g => g.id === pet.group_id)?.name || '—'}
                                                </Typography>
                                            </Stack>
                                        )}
                                    </Stack>
                                </Grid>
                            </Grid>
                            {(pet.preferences || pet.special_notes) && (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <Grid container spacing={2} justifyContent="center">
                                        {pet.preferences && (
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mb: 0.5, fontWeight: 600 }}>
                                                    Sở thích:
                                                </Typography>
                                                <Typography variant="body2">{pet.preferences}</Typography>
                                            </Grid>
                                        )}
                                        {pet.special_notes && (
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, mb: 0.5, fontWeight: 600 }}>
                                                    Ghi chú đặc biệt:
                                                </Typography>
                                                <Typography variant="body2">{pet.special_notes}</Typography>
                                            </Grid>
                                        )}
                                    </Grid>
                                </>
                            )}
                        </Paper>

                        {/* Vaccination Records and Health Records - 2 Columns */}
                        <Grid container spacing={3} sx={{ width: '100%', display: 'flex' }}>
                            {/* Left Column: Vaccination Records */}
                            <Grid item xs={12} sm={6} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: 2,
                                        background: alpha(COLORS.SUCCESS[50], 0.3),
                                        border: `2px solid ${alpha(COLORS.SUCCESS[200], 0.4)}`,
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                        <Vaccines sx={{ color: COLORS.SUCCESS[700], fontSize: 28 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.SUCCESS[700] }}>
                                            Hồ sơ tiêm phòng
                                        </Typography>
                                        <Chip
                                            label={vaccinations.length}
                                            size="small"
                                            sx={{
                                                background: alpha(COLORS.SUCCESS[100], 0.7),
                                                color: COLORS.SUCCESS[800],
                                                fontWeight: 700
                                            }}
                                        />
                                    </Stack>
                                    <Divider sx={{ mb: 2 }} />
                                    {vaccinations.length > 0 ? (
                                        <Stack spacing={2} sx={{ flex: 1, overflow: 'auto' }}>
                                            {vaccinations.map((vaccination, index) => (
                                                <Paper
                                                    key={vaccination.id || index}
                                                    elevation={0}
                                                    sx={{
                                                        p: 3,
                                                        background: '#fff',
                                                        border: `1px solid ${alpha(COLORS.SUCCESS[200], 0.3)}`,
                                                        borderRadius: 2,
                                                        '&:hover': {
                                                            border: `1px solid ${alpha(COLORS.SUCCESS[300], 0.5)}`,
                                                            boxShadow: `0 2px 8px ${alpha(COLORS.SUCCESS[200], 0.2)}`
                                                        }
                                                    }}
                                                >
                                                    <Stack spacing={2}>
                                                        {/* Vaccine Type Header */}
                                                        <Box>
                                                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                                                <Vaccines sx={{ color: COLORS.SUCCESS[700], fontSize: 24 }} />
                                                                <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.SUCCESS[700] }}>
                                                                    {vaccination.vaccine_type?.name || 'Vaccine'}
                                                                </Typography>
                                                                {vaccination.vaccine_type?.is_required && (
                                                                    <Chip
                                                                        label="Bắt buộc"
                                                                        size="small"
                                                                        sx={{
                                                                            bgcolor: alpha(COLORS.ERROR[500], 0.1),
                                                                            color: COLORS.ERROR[700],
                                                                            fontWeight: 600,
                                                                            fontSize: '0.7rem'
                                                                        }}
                                                                    />
                                                                )}
                                                            </Stack>
                                                            {vaccination.vaccine_type?.description && (
                                                                <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY, ml: 4 }}>
                                                                    {vaccination.vaccine_type.description}
                                                                </Typography>
                                                            )}
                                                        </Box>

                                                        <Divider />

                                                        {/* Vaccination Details */}
                                                        <Grid container spacing={2}>
                                                            <Grid item xs={12} sm={6}>
                                                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                                                    <CalendarToday sx={{ fontSize: 18, color: COLORS.INFO[600], mt: 0.5, flexShrink: 0 }} />
                                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block' }}>
                                                                            Ngày tiêm
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                                                                            {vaccination.vaccination_date ? new Date(vaccination.vaccination_date).toLocaleDateString('vi-VN', {
                                                                                year: 'numeric',
                                                                                month: 'long',
                                                                                day: 'numeric'
                                                                            }) : '—'}
                                                                        </Typography>
                                                                    </Box>
                                                                </Stack>
                                                            </Grid>
                                                            <Grid item xs={12} sm={6}>
                                                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                                                    <Event sx={{ fontSize: 18, color: COLORS.WARNING[600], mt: 0.5, flexShrink: 0 }} />
                                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block' }}>
                                                                            Ngày tiêm lại
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.WARNING[700], wordBreak: 'break-word' }}>
                                                                            {vaccination.next_due_date ? new Date(vaccination.next_due_date).toLocaleDateString('vi-VN', {
                                                                                year: 'numeric',
                                                                                month: 'long',
                                                                                day: 'numeric'
                                                                            }) : '—'}
                                                                        </Typography>
                                                                    </Box>
                                                                </Stack>
                                                            </Grid>
                                                            <Grid item xs={12} sm={6}>
                                                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                                                    <Person sx={{ fontSize: 18, color: COLORS.PRIMARY[600], mt: 0.5, flexShrink: 0 }} />
                                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block' }}>
                                                                            Bác sĩ
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                                                                            {vaccination.veterinarian || '—'}
                                                                        </Typography>
                                                                    </Box>
                                                                </Stack>
                                                            </Grid>
                                                            <Grid item xs={12} sm={6}>
                                                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                                                    <LocalHospital sx={{ fontSize: 18, color: COLORS.ERROR[600], mt: 0.5, flexShrink: 0 }} />
                                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block' }}>
                                                                            Phòng khám
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                                                                            {vaccination.clinic_name || '—'}
                                                                        </Typography>
                                                                    </Box>
                                                                </Stack>
                                                            </Grid>
                                                            <Grid item xs={12} sm={6}>
                                                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                                                    <Inventory sx={{ fontSize: 18, color: COLORS.INFO[600], mt: 0.5, flexShrink: 0 }} />
                                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block' }}>
                                                                            Lô vaccine
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                                                                            {vaccination.batch_number || '—'}
                                                                        </Typography>
                                                                    </Box>
                                                                </Stack>
                                                            </Grid>
                                                            {vaccination.vaccine_type?.interval_months && (
                                                                <Grid item xs={12} sm={6}>
                                                                    <Stack direction="row" spacing={1} alignItems="flex-start">
                                                                        <Event sx={{ fontSize: 18, color: COLORS.SUCCESS[600], mt: 0.5, flexShrink: 0 }} />
                                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                            <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block' }}>
                                                                                Chu kỳ tiêm lại
                                                                            </Typography>
                                                                            <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                                                                                {vaccination.vaccine_type.interval_months} tháng
                                                                            </Typography>
                                                                        </Box>
                                                                    </Stack>
                                                                </Grid>
                                                            )}
                                                        </Grid>

                                                        {/* Notes */}
                                                        {vaccination.notes && (
                                                            <>
                                                                <Divider />
                                                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                                                    <Description sx={{ fontSize: 18, color: COLORS.TEXT.SECONDARY, mt: 0.5 }} />
                                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block', mb: 0.5 }}>
                                                                            Ghi chú
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                                                            {vaccination.notes}
                                                                        </Typography>
                                                                    </Box>
                                                                </Stack>
                                                            </>
                                                        )}

                                                        {/* Schedule Info */}
                                                        {vaccination.schedule && (
                                                            <>
                                                                <Divider />
                                                                <Box
                                                                    sx={{
                                                                        p: 1.5,
                                                                        borderRadius: 1,
                                                                        bgcolor: alpha(COLORS.INFO[50], 0.5),
                                                                        border: `1px solid ${alpha(COLORS.INFO[200], 0.3)}`
                                                                    }}
                                                                >
                                                                    <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block', mb: 0.5 }}>
                                                                        Thông tin lịch hẹn
                                                                    </Typography>
                                                                    <Stack spacing={0.5}>
                                                                        <Typography variant="body2">
                                                                            <strong>Trạng thái:</strong>{' '}
                                                                            <Chip
                                                                                label={vaccination.schedule.status === 'COMPLETED' ? 'Đã hoàn thành' : vaccination.schedule.status}
                                                                                size="small"
                                                                                sx={{
                                                                                    bgcolor: vaccination.schedule.status === 'COMPLETED' ? alpha(COLORS.SUCCESS[500], 0.1) : alpha(COLORS.WARNING[500], 0.1),
                                                                                    color: vaccination.schedule.status === 'COMPLETED' ? COLORS.SUCCESS[700] : COLORS.WARNING[700],
                                                                                    fontWeight: 600,
                                                                                    fontSize: '0.7rem',
                                                                                    height: 20
                                                                                }}
                                                                            />
                                                                        </Typography>
                                                                        {vaccination.schedule.completed_date && (
                                                                            <Typography variant="body2">
                                                                                <strong>Ngày hoàn thành:</strong> {new Date(vaccination.schedule.completed_date).toLocaleDateString('vi-VN')}
                                                                            </Typography>
                                                                        )}
                                                                        {vaccination.schedule.notes && (
                                                                            <Typography variant="body2">
                                                                                <strong>Ghi chú lịch hẹn:</strong> {vaccination.schedule.notes}
                                                                            </Typography>
                                                                        )}
                                                                    </Stack>
                                                                </Box>
                                                            </>
                                                        )}
                                                    </Stack>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    ) : (
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 4,
                                                textAlign: 'center',
                                                borderRadius: 2,
                                                border: '1px dashed',
                                                borderColor: 'divider'
                                            }}
                                        >
                                            <Vaccines sx={{ fontSize: 48, color: COLORS.TEXT.DISABLED, mb: 1 }} />
                                            <Typography variant="body1" color="text.secondary">
                                                Chưa có hồ sơ tiêm phòng
                                            </Typography>
                                        </Paper>
                                    )}
                                </Paper>
                            </Grid>

                            {/* Right Column: Health Records */}
                            <Grid item xs={12} sm={6} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: 2,
                                        background: alpha(COLORS.INFO[50], 0.3),
                                        border: `2px solid ${alpha(COLORS.INFO[200], 0.4)}`,
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                        <HealthAndSafety sx={{ color: COLORS.INFO[700], fontSize: 28 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.INFO[700] }}>
                                            Hồ sơ sức khỏe
                                        </Typography>
                                        <Chip
                                            label={healthRecords.length}
                                            size="small"
                                            sx={{
                                                background: alpha(COLORS.INFO[100], 0.7),
                                                color: COLORS.INFO[800],
                                                fontWeight: 700
                                            }}
                                        />
                                    </Stack>
                                    <Divider sx={{ mb: 2 }} />
                                    {healthRecords.length > 0 ? (
                                        <Stack spacing={2}>
                                            {healthRecords.map((healthRecord, index) => (
                                                <Paper
                                                    key={healthRecord.id || index}
                                                    elevation={0}
                                                    sx={{
                                                        p: 3,
                                                        background: '#fff',
                                                        border: `1px solid ${alpha(COLORS.INFO[200], 0.3)}`,
                                                        borderRadius: 2,
                                                        '&:hover': {
                                                            border: `1px solid ${alpha(COLORS.INFO[300], 0.5)}`,
                                                            boxShadow: `0 2px 8px ${alpha(COLORS.INFO[200], 0.2)}`
                                                        }
                                                    }}
                                                >
                                                    <Stack spacing={2}>
                                                        {/* Health Record Header */}
                                                        <Box>
                                                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                                                <MonitorHeart sx={{ color: COLORS.INFO[700], fontSize: 24 }} />
                                                                <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.INFO[700] }}>
                                                                    Lần khám {index + 1}
                                                                </Typography>
                                                                {(() => {
                                                                    const statusInfo = getHealthStatusInfo(healthRecord.health_status);
                                                                    return (
                                                                        <Chip
                                                                            label={statusInfo.label}
                                                                            size="small"
                                                                            sx={{
                                                                                bgcolor: alpha(statusInfo.color[600], 0.2),
                                                                                color: statusInfo.color[700],
                                                                                fontWeight: 600,
                                                                                fontSize: '0.7rem'
                                                                            }}
                                                                        />
                                                                    );
                                                                })()}
                                                            </Stack>
                                                        </Box>

                                                        <Divider />

                                                        {/* Health Record Details */}
                                                        <Grid container spacing={2}>
                                                            <Grid item xs={12} sm={6}>
                                                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                                                    <CalendarToday sx={{ fontSize: 18, color: COLORS.INFO[600], mt: 0.5, flexShrink: 0 }} />
                                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block' }}>
                                                                            Ngày khám
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                                                                            {healthRecord.check_date ? new Date(healthRecord.check_date).toLocaleDateString('vi-VN', {
                                                                                year: 'numeric',
                                                                                month: 'long',
                                                                                day: 'numeric'
                                                                            }) : '—'}
                                                                        </Typography>
                                                                    </Box>
                                                                </Stack>
                                                            </Grid>
                                                            <Grid item xs={12} sm={6}>
                                                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                                                    <Event sx={{ fontSize: 18, color: COLORS.WARNING[600], mt: 0.5, flexShrink: 0 }} />
                                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block' }}>
                                                                            Ngày khám lại
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.WARNING[700], wordBreak: 'break-word' }}>
                                                                            {healthRecord.next_check_date ? new Date(healthRecord.next_check_date).toLocaleDateString('vi-VN', {
                                                                                year: 'numeric',
                                                                                month: 'long',
                                                                                day: 'numeric'
                                                                            }) : '—'}
                                                                        </Typography>
                                                                    </Box>
                                                                </Stack>
                                                            </Grid>
                                                            <Grid item xs={12} sm={6}>
                                                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                                                    <Inventory sx={{ fontSize: 18, color: COLORS.PRIMARY[600], mt: 0.5, flexShrink: 0 }} />
                                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block' }}>
                                                                            Cân nặng
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                                                                            {healthRecord.weight ? `${healthRecord.weight} kg` : '—'}
                                                                        </Typography>
                                                                    </Box>
                                                                </Stack>
                                                            </Grid>
                                                            <Grid item xs={12} sm={6}>
                                                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                                                    <Thermostat sx={{ fontSize: 18, color: COLORS.ERROR[600], mt: 0.5, flexShrink: 0 }} />
                                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block' }}>
                                                                            Nhiệt độ
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                                                                            {healthRecord.temperature ? `${healthRecord.temperature}°C` : '—'}
                                                                        </Typography>
                                                                    </Box>
                                                                </Stack>
                                                            </Grid>
                                                            <Grid item xs={12} sm={6}>
                                                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                                                    <Person sx={{ fontSize: 18, color: COLORS.PRIMARY[600], mt: 0.5, flexShrink: 0 }} />
                                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block' }}>
                                                                            Bác sĩ
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                                                                            {healthRecord.veterinarian || '—'}
                                                                        </Typography>
                                                                    </Box>
                                                                </Stack>
                                                            </Grid>
                                                        </Grid>

                                                        {/* Symptoms */}
                                                        {healthRecord.symptoms && (
                                                            <>
                                                                <Divider />
                                                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                                                    <Warning sx={{ fontSize: 18, color: COLORS.WARNING[600], mt: 0.5 }} />
                                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block', mb: 0.5 }}>
                                                                            Triệu chứng
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                                                            {healthRecord.symptoms}
                                                                        </Typography>
                                                                    </Box>
                                                                </Stack>
                                                            </>
                                                        )}

                                                        {/* Treatment */}
                                                        {healthRecord.treatment && (
                                                            <>
                                                                <Divider />
                                                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                                                    <LocalHospital sx={{ fontSize: 18, color: COLORS.INFO[600], mt: 0.5 }} />
                                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block', mb: 0.5 }}>
                                                                            Điều trị
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                                                            {healthRecord.treatment}
                                                                        </Typography>
                                                                    </Box>
                                                                </Stack>
                                                            </>
                                                        )}

                                                        {/* Notes */}
                                                        {healthRecord.notes && (
                                                            <>
                                                                <Divider />
                                                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                                                    <Description sx={{ fontSize: 18, color: COLORS.TEXT.SECONDARY, mt: 0.5 }} />
                                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                        <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, display: 'block', mb: 0.5 }}>
                                                                            Ghi chú
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                                                            {healthRecord.notes}
                                                                        </Typography>
                                                                    </Box>
                                                                </Stack>
                                                            </>
                                                        )}
                                                    </Stack>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    ) : (
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 4,
                                                textAlign: 'center',
                                                borderRadius: 2,
                                                border: '1px dashed',
                                                borderColor: 'divider'
                                            }}
                                        >
                                            <HealthAndSafety sx={{ fontSize: 48, color: COLORS.TEXT.DISABLED, mb: 1 }} />
                                            <Typography variant="body1" color="text.secondary">
                                                Chưa có hồ sơ sức khỏe
                                            </Typography>
                                        </Paper>
                                    )}
                                </Paper>
                            </Grid>
                        </Grid>
                    </Stack>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(COLORS.BORDER.DEFAULT, 0.1)}` }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{
                        background: `linear-gradient(135deg, ${COLORS.ERROR[500]} 0%, ${COLORS.ERROR[700]} 100())`,
                        color: '#fff',
                        fontWeight: 700,
                        px: 3,
                        '&:hover': {
                            background: `linear-gradient(135deg, ${COLORS.ERROR[600]} 0%, ${COLORS.ERROR[800]} 100())`
                        }
                    }}
                >
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ViewPetDetailsModal;