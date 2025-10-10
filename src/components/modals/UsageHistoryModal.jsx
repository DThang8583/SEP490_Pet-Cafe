/**
 * UsageHistoryModal.jsx
 * 
 * Modal for displaying usage history (staff taking materials from warehouse)
 * Shows all material withdrawals with filters
 */

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Stack,
    Chip,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    InputAdornment,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    alpha
} from '@mui/material';
import {
    Close,
    History,
    LocalShipping,
    CalendarMonth,
    TrendingDown,
    FilterList,
    Person
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import inventoryApi from '../../api/inventoryApi';
import { managerApi } from '../../api/userApi';

const UsageHistoryModal = ({ open, onClose, materials = [] }) => {
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [filters, setFilters] = useState({
        materialId: '',
        takenBy: '',
        startDate: '',
        endDate: ''
    });

    // Fetch staff list
    const fetchStaff = async () => {
        try {
            const response = await managerApi.getStaff();
            setStaffList(response.data || []);
        } catch (error) {
            console.error('Error fetching staff:', error);
            setStaffList([]);
        }
    };

    // Fetch history
    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await inventoryApi.getUsageHistory(filters);
            setHistory(response.data || []);
        } catch (error) {
            console.error('Error fetching usage history:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get staff name by ID
    const getStaffName = (staffId) => {
        const staff = staffList.find(s => s.id === staffId);
        return staff?.name || staff?.full_name || 'Unknown User';
    };

    // Fetch staff list and initial history when modal opens
    useEffect(() => {
        if (open) {
            fetchStaff();
            fetchHistory();
        }
    }, [open]);

    // Fetch history when filters change
    useEffect(() => {
        if (open && (filters.materialId || filters.takenBy || filters.startDate || filters.endDate)) {
            fetchHistory();
        }
    }, [filters]);

    // Handle filter change
    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    // Reset filters
    const handleResetFilters = () => {
        setFilters({
            materialId: '',
            takenBy: '',
            startDate: '',
            endDate: ''
        });
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    maxHeight: '90vh'
                }
            }}
        >
            {/* Header */}
            <DialogTitle
                sx={{
                    bgcolor: COLORS.ERROR[500],
                    color: 'white',
                    pb: 2
                }}
            >
                <Stack direction="row" spacing={2} alignItems="center">
                    <History sx={{ fontSize: 32 }} />
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Lịch sử lấy nguyên liệu
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                            Xem lại các lần nhân viên lấy nguyên liệu từ kho
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: 'white' }}>
                        <Close />
                    </IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent sx={{ pt: 3, pb: 2 }}>
                <Stack spacing={3}>
                    {/* Filters */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            background: alpha(COLORS.ERROR[500], 0.02)
                        }}
                    >
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                            <FilterList color="primary" />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
                                Bộ lọc
                            </Typography>
                            <Button size="small" onClick={handleResetFilters}>
                                Đặt lại
                            </Button>
                        </Stack>

                        <Stack direction="row" spacing={2} flexWrap="wrap">
                            {/* Material Filter */}
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Nguyên liệu</InputLabel>
                                <Select
                                    value={filters.materialId}
                                    onChange={(e) => handleFilterChange('materialId', e.target.value)}
                                    label="Nguyên liệu"
                                >
                                    <MenuItem value="">Tất cả</MenuItem>
                                    {materials.map(mat => (
                                        <MenuItem key={mat.id} value={mat.id}>
                                            {mat.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Staff Filter */}
                            <TextField
                                size="small"
                                label="Người lấy"
                                value={filters.takenBy}
                                onChange={(e) => handleFilterChange('takenBy', e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Person fontSize="small" />
                                        </InputAdornment>
                                    )
                                }}
                                sx={{ minWidth: 200 }}
                            />

                            {/* Date Range */}
                            <TextField
                                size="small"
                                type="date"
                                label="Từ ngày"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ minWidth: 160 }}
                            />
                            <TextField
                                size="small"
                                type="date"
                                label="Đến ngày"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ minWidth: 160 }}
                            />
                        </Stack>
                    </Paper>

                    {/* Summary */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            Tổng số: <Chip label={`${history.length} lần lấy`} size="small" color="error" sx={{ ml: 1 }} />
                        </Typography>
                    </Stack>

                    {/* History Table */}
                    <TableContainer
                        component={Paper}
                        sx={{
                            maxHeight: 500,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider'
                        }}
                    >
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800, bgcolor: alpha(COLORS.ERROR[500], 0.1) }}>
                                        Thời gian lấy ra
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, bgcolor: alpha(COLORS.ERROR[500], 0.1) }}>
                                        Tên nguyên liệu
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, bgcolor: alpha(COLORS.ERROR[500], 0.1) }} align="right">
                                        Số lượng lấy ra
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, bgcolor: alpha(COLORS.ERROR[500], 0.1) }}>
                                        Người lấy ra
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Đang tải...
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : history.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Không có lịch sử lấy nguyên liệu
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    history.map((item) => (
                                        <TableRow key={item.id} hover>
                                            <TableCell>
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <CalendarMonth fontSize="small" color="action" />
                                                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                                        {formatDate(item.takenAt)}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {item.materialName}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Chip
                                                    icon={<TrendingDown fontSize="small" />}
                                                    label={`-${item.quantityTaken} ${item.unit}`}
                                                    size="small"
                                                    color="error"
                                                    sx={{ fontWeight: 700 }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <Person fontSize="small" color="action" />
                                                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                                        {item.takenById ? getStaffName(item.takenById) : item.takenBy}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, bgcolor: alpha(COLORS.ERROR[500], 0.02) }}>
                <Button onClick={onClose} variant="contained" color="error">
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UsageHistoryModal;

