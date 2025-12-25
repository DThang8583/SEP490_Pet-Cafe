import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Button, IconButton, Typography, TextField, Stack, MenuItem, CircularProgress } from '@mui/material';
import { Close, Print as PrintIcon } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { COLORS } from '../../constants/colors';
import { createLeaveRequest } from '../../api/leaveRequestApi';
import { authApi } from '../../api/authApi';
import AlertModal from './AlertModal';
import ConfirmModal from './ConfirmModal';

const LeaveRequestModal = ({ open, onClose }) => {
    const [replacementEmployeeId, setReplacementEmployeeId] = useState('');
    const [leaveDate, setLeaveDate] = useState('');
    const [reason, setReason] = useState('');
    const [leaveType, setLeaveType] = useState('annual');
    const [loading, setLoading] = useState(false);
    const [alertState, setAlertState] = useState({ open: false, type: 'success', title: 'Thông báo', message: '' });
    const [confirmOpen, setConfirmOpen] = useState(false);
    const previewRef = useRef(null);

    const currentUser = authApi.getCurrentUser?.() || {};
    const currentEmployeeName = currentUser.employee?.full_name || currentUser.full_name || localStorage.getItem('accountFullName') || '';
    const currentEmployeeId = currentUser.employee?.id || currentUser.id || localStorage.getItem('accountId') || '';

    useEffect(() => {
        if (open) {
            // default leaveDate to today start
            const d = new Date();
            const isoLocal = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,16);
            setLeaveDate(isoLocal);
            setReplacementEmployeeId('');
            setReason('');
            setLeaveType('annual');
        }
    }, [open]);

    const validate = () => {
        if (!leaveDate) return 'Vui lòng chọn ngày nghỉ';
        if (!reason || reason.trim().length < 5) return 'Vui lòng nhập lý do (ít nhất 5 ký tự)';
        if (!leaveType) return 'Chọn loại nghỉ';
        return null;
    };

    const handleSubmit = async () => {
        const v = validate();
        if (v) {
            setAlertState({ open: true, type: 'error', title: 'Lỗi', message: v });
            return;
        }
        setConfirmOpen(true);
    };

    const doSubmit = async () => {
        setConfirmOpen(false);
        setLoading(true);
        try {
            const currentUser = authApi.getCurrentUser?.() || null;
            const employeeId = localStorage.getItem('accountId') || currentUser?.id;
            const body = {
                employee_id: employeeId,
                replacement_employee_id: replacementEmployeeId || null,
                leave_date: leaveDate ? new Date(leaveDate).toISOString() : null,
                reason: reason,
                leave_type: leaveType
            };
            const resp = await createLeaveRequest(body);
            setAlertState({ open: true, type: 'success', title: 'Thành công', message: resp?.message || 'Tạo đơn nghỉ phép thành công' });
        } catch (err) {
            console.error(err);
            const msg = err?.response?.data?.message || err?.message || 'Không thể tạo đơn nghỉ phép';
            setAlertState({ open: true, type: 'error', title: 'Lỗi', message: msg });
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        if (!previewRef.current) return;
        const w = window.open('', '_blank', 'noopener,noreferrer');
        w.document.write('<html><head><title>Đơn xin nghỉ phép</title>');
        w.document.write(`<style>
            @media print { body { -webkit-print-color-adjust: exact; } }
            body{font-family: "Times New Roman", Times, serif; color:#0b2b4a; padding:28px}
            .doc-container{width:100%;max-width:900px;margin:0 auto;border:1px solid #000;padding:20px}
            .doc-header{text-align:center;margin-bottom:12px}
            .doc-title{font-weight:800;font-size:20px;margin:6px 0}
            .doc-sub{font-size:14px;margin:2px 0}
            .section-title{font-weight:700;margin-top:12px;margin-bottom:8px;border-bottom:2px solid #000;padding-bottom:6px}
            .field-row{display:flex;gap:12px;margin-bottom:8px}
            .field-label{width:180px;font-weight:700}
            .field-value{flex:1;border-bottom:1px dotted #444;padding-bottom:2px}
            .reason-box{min-height:80px;border-left:3px solid #444;padding-left:8px;white-space:pre-wrap}
        </style>`);
        w.document.write('</head><body>');
        w.document.write(`<div class="doc-container">${previewRef.current.innerHTML}</div>`);
        w.document.write('</body></html>');
        w.document.close();
        w.focus();
        w.print();
        w.close();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <Box sx={{ background: `linear-gradient(135deg, ${alpha(COLORS.PRIMARY[50], 0.3)}, ${alpha(COLORS.SECONDARY[50], 0.2)})`, borderBottom: `3px solid ${COLORS.PRIMARY[500]}` }}>
                <DialogTitle sx={{ fontWeight: 800, color: COLORS.PRIMARY[700], display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Đơn xin nghỉ phép</Typography>
                    <IconButton onClick={onClose}><Close /></IconButton>
                </DialogTitle>
            </Box>

            <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                <Box sx={{ fontFamily: `"Times New Roman", Times, serif`, color: '#0b2b4a' }}>
                    <Box sx={{ maxWidth: 920, mx: 'auto', border: '1px solid #000', p: 3 }}>
                        {/* Header */}
                        <Box sx={{ textAlign: 'center', borderBottom: '2px solid #000', pb: 2, mb: 2 }}>
                            <Typography sx={{ fontSize: 20, fontWeight: 800, textTransform: 'uppercase' }}>CÔNG TY PET CAFE</Typography>
                            <Typography sx={{ fontSize: 14 }}>Địa chỉ: 123 Đường Nuôi Thú, Quận Q, TP. HCM</Typography>
                            <Typography sx={{ fontSize: 14 }}>Điện thoại: (028) 0000-0000 | Email: info@petcafe.vn</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                <Typography sx={{ fontSize: 14 }}>Số: {String(new Date().getFullYear()).slice(2)}-{String(Date.now()).slice(-4)}/PX</Typography>
                                <Typography sx={{ fontSize: 14 }}>Ngày: {new Date().toLocaleDateString('vi-VN')}</Typography>
                            </Box>
                        </Box>

                        {/* Title */}
                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                            <Typography sx={{ fontSize: 28, fontWeight: 800, textTransform: 'uppercase' }}>ĐƠN XIN NGHỈ PHÉP</Typography>
                            <Typography sx={{ fontSize: 14, fontStyle: 'italic', mt: 1 }}>Kính gửi: Ban Giám đốc / Bộ phận Nhân sự</Typography>
                        </Box>

                        {/* I. Thông tin người làm đơn */}
                        <Box sx={{ mb: 2 }}>
                            <Typography sx={{ fontWeight: 700, mb: 1, borderBottom: '2px solid #666', pb: 1 }}>I. THÔNG TIN NGƯỜI LÀM ĐƠN</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ display: 'flex' }}>
                                    <Typography sx={{ width: 200, fontWeight: 700 }}>Họ và tên:</Typography>
                                    <Typography sx={{ borderBottom: '1px dotted #444', flex: 1, pb: '2px' }}>{currentEmployeeName || '—'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex' }}>
                                    <Typography sx={{ width: 200, fontWeight: 700 }}>Mã nhân viên:</Typography>
                                    <Typography sx={{ borderBottom: '1px dotted #444', flex: 1, pb: '2px' }}>{currentEmployeeId || '—'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex' }}>
                                    <Typography sx={{ width: 200, fontWeight: 700 }}>Phòng ban / Chức vụ:</Typography>
                                    <Typography sx={{ borderBottom: '1px dotted #444', flex: 1, pb: '2px' }}>{currentUser.employee?.department || currentUser.department || '—'}</Typography>
                                </Box>
                            </Box>
                        </Box>

                        {/* II. Thông tin nghỉ phép */}
                        <Box sx={{ mb: 2 }}>
                            <Typography sx={{ fontWeight: 700, mb: 1, borderBottom: '2px solid #666', pb: 1 }}>II. THÔNG TIN NGHỈ PHÉP</Typography>
                            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                                <Box sx={{ display: 'flex', width: '50%' }}>
                                    <Typography sx={{ width: 160, fontWeight: 700 }}>Ngày nghỉ:</Typography>
                                    <Typography sx={{ borderBottom: '1px dotted #444', flex: 1, pb: '2px' }}>{leaveDate ? new Date(leaveDate).toLocaleString() : '—'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', width: '50%' }}>
                                    <Typography sx={{ width: 160, fontWeight: 700 }}>Loại nghỉ:</Typography>
                                    <Typography sx={{ borderBottom: '1px dotted #444', flex: 1, pb: '2px' }}>{leaveType === 'annual' ? 'Nghỉ phép năm' : leaveType === 'sick' ? 'Nghỉ ốm' : 'Nghỉ việc riêng'}</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex' }}>
                                <Typography sx={{ width: 200, fontWeight: 700 }}>Người thay thế (nếu có):</Typography>
                                <Typography sx={{ borderBottom: '1px dotted #444', flex: 1, pb: '2px' }}>{replacementEmployeeId || '—'}</Typography>
                            </Box>
                        </Box>

                        {/* III. Lý do và cam kết */}
                        <Box sx={{ mb: 2 }}>
                            <Typography sx={{ fontWeight: 700, mb: 1, borderBottom: '2px solid #666', pb: 1 }}>III. LÝ DO VÀ CAM KẾT</Typography>
                            <Box sx={{ pl: 1 }}>
                                <Typography sx={{ mb: 1 }}>Lý do:</Typography>
                                <Box sx={{ minHeight: 100, borderLeft: '3px solid #444', pl: 1, whiteSpace: 'pre-line' }}>{reason || '—'}</Box>
                            </Box>
                        </Box>

                        {/* Signature */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography sx={{ fontWeight: 700 }}>Người làm đơn</Typography>
                                <Typography sx={{ mt: 6, fontWeight: 700 }}>{currentEmployeeName || '—'}</Typography>
                                <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 1 }}>Ngày ký: {new Date().toLocaleDateString('vi-VN')}</Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
                {/* hidden preview reference for printing */}
                <Box sx={{ display: 'none' }}>
                    <div ref={previewRef} />
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose}>Hủy</Button>
                <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint} disabled={!leaveDate}>In/PDF</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={loading}>{loading ? <CircularProgress size={18} /> : 'Gửi đơn'}</Button>
            </DialogActions>

            <AlertModal open={alertState.open} onClose={()=>setAlertState(s=>({...s,open:false}))} title={alertState.title} message={alertState.message} type={alertState.type} okText="Đóng" />
            <ConfirmModal isOpen={confirmOpen} onClose={()=>setConfirmOpen(false)} onConfirm={doSubmit} title="Xác nhận gửi đơn" message="Bạn xác nhận gửi đơn nghỉ phép này?" confirmText="Gửi" cancelText="Hủy" />
        </Dialog>
    );
};

export default LeaveRequestModal;


