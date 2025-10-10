/**
 * RestockHistoryModal.jsx
 * 
 * Modal for displaying restock history of inventory materials
 * Shows all past restock transactions with filters and search
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
    TrendingUp,
    FilterList
} from '@mui/icons-material';
import { COLORS } from '../../constants/colors';
import inventoryApi from '../../api/inventoryApi';

const RestockHistoryModal = ({ open, onClose, materials = [] }) => {
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [filters, setFilters] = useState({
        materialId: '',
        supplier: '',
        startDate: '',
        endDate: ''
    });

    // Fetch history
    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await inventoryApi.getRestockHistory(filters);
            setHistory(response.data || []);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch on mount and filter change
    useEffect(() => {
        if (open) {
            fetchHistory();
        }
    }, [open, filters]);

    // Handle filter change
    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    // Reset filters
    const handleResetFilters = () => {
        setFilters({
            materialId: '',
            supplier: '',
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
            maxWidth="xl"
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
                    bgcolor: COLORS.INFO[500],
                    color: 'white',
                    pb: 2
                }}
            >
                <Stack direction="row" spacing={2} alignItems="center">
                    <History sx={{ fontSize: 32 }} />
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Lịch sử nhập hàng
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                            Xem lại các lần nhập nguyên liệu vào kho
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
                            background: alpha('#667eea', 0.02)
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

                            {/* Supplier Filter */}
                            <TextField
                                size="small"
                                label="Nhà cung cấp"
                                value={filters.supplier}
                                onChange={(e) => handleFilterChange('supplier', e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LocalShipping fontSize="small" />
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
                            Tổng số: <Chip label={`${history.length} lần nhập`} size="small" color="primary" sx={{ ml: 1 }} />
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
                                    <TableCell sx={{ fontWeight: 800, bgcolor: alpha('#667eea', 0.1) }}>
                                        Thời gian
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, bgcolor: alpha('#667eea', 0.1) }}>
                                        Nguyên liệu
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, bgcolor: alpha('#667eea', 0.1) }} align="right">
                                        SL nhập
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, bgcolor: alpha('#667eea', 0.1) }} align="right">
                                        Trước → Sau
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, bgcolor: alpha('#667eea', 0.1) }}>
                                        Nhà cung cấp
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, bgcolor: alpha('#667eea', 0.1) }}>
                                        HSD
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Đang tải...
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : history.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Không có lịch sử nhập hàng
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
                                                        {formatDate(item.restockedAt)}
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
                                                    icon={<TrendingUp fontSize="small" />}
                                                    label={`+${item.quantityAdded} ${item.unit}`}
                                                    size="small"
                                                    color="success"
                                                    sx={{ fontWeight: 700 }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                                    <span style={{ color: '#d32f2f' }}>{item.quantityBefore}</span>
                                                    {' → '}
                                                    <span style={{ color: '#2e7d32', fontWeight: 700 }}>{item.quantityAfter}</span>
                                                    {' '}{item.unit}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <LocalShipping fontSize="small" color="action" />
                                                    <Typography variant="body2">
                                                        {item.supplier}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                                    {new Date(item.expiryDate).toLocaleDateString('vi-VN')}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, bgcolor: alpha('#667eea', 0.02) }}>
                <Button onClick={onClose} variant="contained" color="primary">
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RestockHistoryModal;

