import React, { useEffect, useState, useMemo } from 'react';
import { Box, Container, Typography, Chip, Button, Stack, CircularProgress, Alert, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Card, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { COLORS } from '../../constants/colors';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Person, People, AccessTime, Event } from '@mui/icons-material';
import { authApi } from '../../api/authApi';

const TEAMS_API_URL = 'https://petcafes.azurewebsites.net/api/teams';

const AttendancePage = () => {
    const navigate = useNavigate();
    const [teams, setTeams] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [teamDetails, setTeamDetails] = useState({});
    const [loadingTeamDetails, setLoadingTeamDetails] = useState({});
    const [attendanceStatus, setAttendanceStatus] = useState({}); // { employeeId: 'present' | 'absent' | 'late' }
    const [attendanceNotes, setAttendanceNotes] = useState({}); // { employeeId: 'note text' }
    const [isLeader, setIsLeader] = useState(false);
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);
    const [currentEmployee, setCurrentEmployee] = useState(null);
    const [currentStatus, setCurrentStatus] = useState(null);
    const [savingAttendance, setSavingAttendance] = useState(false);

    const today = useMemo(() => new Date().toLocaleDateString('vi-VN'), []);

    // Load current user
    useEffect(() => {
        const user = authApi.getCurrentUser();
        if (user) {
            setCurrentUser(user);
        }
    }, []);

    // Load teams and check if user is leader
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('authToken');
                const resp = await fetch(TEAMS_API_URL, {
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : '',
                        'Accept': 'application/json'
                    }
                });
                if (!resp.ok) {
                    if (resp.status === 401) {
                        throw new Error('Không có quyền truy cập. Vui lòng đăng nhập lại.');
                    }
                    throw new Error(`Lỗi ${resp.status}: Không thể tải dữ liệu`);
                }
                const json = await resp.json();
                const list = Array.isArray(json?.data) ? json.data : [];
                setTeams(list);

                // Check if current user is a leader
                const userFullName = currentUser?.fullName || currentUser?.name || '';
                if (userFullName) {
                    const userIsLeader = list.some(team => {
                        const leaderFullName = team?.leader?.full_name || '';
                        return leaderFullName === userFullName;
                    });
                    setIsLeader(userIsLeader);

                    // If user is leader, load team details
                    if (userIsLeader) {
                        const leaderTeam = list.find(team => {
                            const leaderFullName = team?.leader?.full_name || '';
                            return leaderFullName === userFullName;
                        });
                        if (leaderTeam) {
                            await loadTeamDetails(leaderTeam.id);
                        }
                    }
                }
            } catch (e) {
                setError(e.message || 'Không thể tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };
        if (currentUser) {
            load();
        }
    }, [currentUser]);

    // Load team details
    const loadTeamDetails = async (teamId) => {
        if (teamDetails[teamId]) return;
        
        setLoadingTeamDetails(prev => ({ ...prev, [teamId]: true }));
        try {
            const token = localStorage.getItem('authToken');
            const resp = await fetch(`${TEAMS_API_URL}/${teamId}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Accept': 'application/json'
                }
            });
            if (!resp.ok) throw new Error('Không thể tải chi tiết nhóm');
            const json = await resp.json();
            const teamData = json?.data || json;
            setTeamDetails(prev => ({ ...prev, [teamId]: teamData }));
        } catch (e) {
            console.error('Error loading team details:', e);
        } finally {
            setLoadingTeamDetails(prev => ({ ...prev, [teamId]: false }));
        }
    };

    // Get current user's team
    const userTeam = useMemo(() => {
        if (!currentUser || !isLeader) return null;
        const userFullName = currentUser.fullName || currentUser.name || '';
        return teams.find(team => {
            const leaderFullName = team?.leader?.full_name || '';
            return leaderFullName === userFullName;
        });
    }, [teams, currentUser, isLeader]);

    // Get team members for attendance
    const teamMembers = useMemo(() => {
        if (!userTeam) return [];
        const detail = teamDetails[userTeam.id];
        if (!detail || !detail.team_members) return [];
        return detail.team_members.filter(member => member.employee);
    }, [userTeam, teamDetails]);

    // Handle attendance marking
    const handleMarkAttendance = (employee, status) => {
        setCurrentEmployee(employee);
        setCurrentStatus(status);
        
        // If status is 'absent' or 'late', open note dialog
        if (status === 'absent' || status === 'late') {
            setNoteDialogOpen(true);
        } else {
            // For 'present', save directly without note
            saveAttendance(employee.id, status, '');
        }
    };

    // Save attendance to API
    const saveAttendance = async (employeeId, status, note = '') => {
        if (!userTeam) return;

        try {
            setSavingAttendance(true);
            const token = localStorage.getItem('authToken');
            
            // Map status to API format
            const apiStatus = status === 'present' || status === 'late' ? 'PRESENT' : 'ABSENT';
            
            // Prepare request body
            const requestBody = [
                {
                    id: employeeId, // employee_id
                    status: apiStatus,
                    notes: note || ''
                }
            ];

            const resp = await fetch(`${TEAMS_API_URL}/${userTeam.id}/daily-schedules`, {
                method: 'PUT',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!resp.ok) {
                if (resp.status === 401) {
                    throw new Error('Không có quyền truy cập. Vui lòng đăng nhập lại.');
                }
                throw new Error(`Lỗi ${resp.status}: Không thể lưu điểm danh`);
            }

            // Update local state
            setAttendanceStatus(prev => ({
                ...prev,
                [employeeId]: status
            }));
            
            if (note) {
                setAttendanceNotes(prev => ({
                    ...prev,
                    [employeeId]: note
                }));
            }

            // Show success message
            setError('');
        } catch (e) {
            setError(e.message || 'Không thể lưu điểm danh');
        } finally {
            setSavingAttendance(false);
            setNoteDialogOpen(false);
            setCurrentEmployee(null);
            setCurrentStatus(null);
        }
    };

    // Handle note dialog save
    const handleSaveNote = () => {
        if (!currentEmployee || !currentStatus) return;
        const note = attendanceNotes[currentEmployee.id] || '';
        saveAttendance(currentEmployee.id, currentStatus, note);
    };

    // If not leader, show access denied
    if (!loading && !isLeader) {
        return (
            <Box sx={{
                py: 3,
                minHeight: '100vh',
                background: `radial-gradient(900px 260px at -10% -10%, ${COLORS.ERROR[50]}, transparent 60%),
                             radial-gradient(900px 260px at 110% 0%, ${COLORS.INFO[50]}, transparent 60%),
                             ${COLORS.BACKGROUND.NEUTRAL}`
            }}>
                <Container maxWidth="xl">
                    <Alert severity="warning" sx={{ mt: 3 }}>
                        Bạn không có quyền truy cập trang này. Chỉ Leader mới có thể điểm danh nhân viên.
                    </Alert>
                </Container>
            </Box>
        );
    }

    return (
        <Box sx={{
            py: 3,
            minHeight: '100vh',
            background: `radial-gradient(900px 260px at -10% -10%, ${COLORS.WARNING[50]}, transparent 60%),
                         radial-gradient(900px 260px at 110% 0%, ${COLORS.SECONDARY[50]}, transparent 60%),
                         ${COLORS.BACKGROUND.NEUTRAL}`
        }}>
            <Container maxWidth="xl">
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" sx={{ mb: 3 }} spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <AccessTime sx={{ color: COLORS.WARNING[600], fontSize: 32 }} />
                        <Typography variant="h4" sx={{ fontWeight: 700, color: COLORS.WARNING[600], letterSpacing: '-0.02em', lineHeight: 1.2 }}>Điểm danh nhân viên</Typography>
                    </Stack>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Chip 
                            icon={<Event />}
                            label={`Hôm nay: ${today}`}
                            color="warning"
                            sx={{ fontWeight: 700 }}
                        />
                        {userTeam && (
                            <Chip 
                                label={userTeam.name}
                                color="error"
                                sx={{ fontWeight: 700 }}
                            />
                        )}
                    </Stack>
                </Stack>

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress color="warning" />
                    </Box>
                )}

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {!loading && isLeader && userTeam && (
                    <Stack spacing={3}>
                        {/* Info Card */}
                        <Card sx={{
                            borderRadius: 4,
                            boxShadow: 6,
                            p: 3,
                            background: `linear-gradient(135deg, ${alpha(COLORS.WARNING[50], 0.8)} 0%, ${alpha(COLORS.SECONDARY[50], 0.6)} 100%)`
                        }}>
                            {userTeam.leader && (
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Avatar src={userTeam.leader.avatar_url} sx={{ width: 48, height: 48 }}>
                                        <Person />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                            Leader: <strong>{userTeam.leader.full_name}</strong>
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                            {userTeam.description || 'Không có mô tả'}
                                        </Typography>
                                    </Box>
                                </Stack>
                            )}
                        </Card>

                        {/* Team Members Attendance Table */}
                        {loadingTeamDetails[userTeam.id] ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress color="warning" />
                            </Box>
                        ) : teamMembers.length > 0 ? (
                            <Paper elevation={4} sx={{ borderRadius: 4, overflow: 'hidden' }}>
                                <Box sx={{ 
                                    p: 2.5, 
                                    bgcolor: COLORS.WARNING[600], 
                                    color: 'white',
                                    background: `linear-gradient(135deg, ${COLORS.WARNING[600]} 0%, ${COLORS.WARNING[700]} 100%)`
                                }}>
                                    <Stack direction="row" alignItems="center" spacing={1.5}>
                                        <People sx={{ fontSize: 28 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                                            Danh sách nhân viên ({teamMembers.length})
                                        </Typography>
                                    </Stack>
                                </Box>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: alpha(COLORS.WARNING[100], 0.5) }}>
                                                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', letterSpacing: '0.01em', width: '60px' }}>Avatar</TableCell>
                                                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', letterSpacing: '0.01em' }}>Họ và tên</TableCell>
                                                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', letterSpacing: '0.01em' }}>Email</TableCell>
                                                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', letterSpacing: '0.01em' }}>Số điện thoại</TableCell>
                                                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', letterSpacing: '0.01em' }}>Vai trò</TableCell>
                                                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', letterSpacing: '0.01em', textAlign: 'center' }}>Trạng thái điểm danh</TableCell>
                                                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', letterSpacing: '0.01em', textAlign: 'center', width: '250px' }}>Thao tác</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {teamMembers.map((member, index) => {
                                                const employee = member.employee;
                                                const currentStatus = attendanceStatus[employee.id];
                                                
                                                return (
                                                    <TableRow 
                                                        key={member.id || index}
                                                        sx={{ 
                                                            '&:hover': { bgcolor: alpha(COLORS.WARNING[50], 0.3) },
                                                            '&:nth-of-type(even)': { bgcolor: alpha(COLORS.GRAY[50], 0.3) }
                                                        }}
                                                    >
                                                        <TableCell>
                                                            <Avatar src={employee.avatar_url} sx={{ width: 48, height: 48 }}>
                                                                <Person />
                                                            </Avatar>
                                                        </TableCell>
                                                        <TableCell sx={{ fontWeight: 500, fontSize: '0.9375rem', lineHeight: 1.5 }}>
                                                            {employee.full_name || '-'}
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>{employee.email || '-'}</TableCell>
                                                        <TableCell sx={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>{employee.phone || '-'}</TableCell>
                                                        <TableCell>
                                                            <Chip 
                                                                label={employee.sub_role === 'SALE_STAFF' ? 'Nhân viên bán hàng' : 
                                                                       employee.sub_role === 'WORKING_STAFF' ? 'Nhân viên chăm sóc' : 
                                                                       employee.sub_role || 'Nhân viên'}
                                                                size="small"
                                                                color="info"
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ textAlign: 'center' }}>
                                                            {currentStatus ? (
                                                                <Chip
                                                                    icon={<CheckCircle />}
                                                                    label={currentStatus === 'present' ? 'Có mặt' : 
                                                                           currentStatus === 'absent' ? 'Vắng mặt' : 
                                                                           'Đi muộn'}
                                                                    color={currentStatus === 'present' ? 'success' : 
                                                                           currentStatus === 'absent' ? 'error' : 'warning'}
                                                                    size="small"
                                                                />
                                                            ) : (
                                                                <Chip
                                                                    label="Chưa điểm danh"
                                                                    size="small"
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Stack direction="row" spacing={1} justifyContent="center">
                                                                <Button
                                                                    size="small"
                                                                    variant={currentStatus === 'present' ? 'contained' : 'outlined'}
                                                                    color="success"
                                                                    disabled={savingAttendance}
                                                                    onClick={() => handleMarkAttendance(employee, 'present')}
                                                                    sx={{ minWidth: 80 }}
                                                                >
                                                                    Có mặt
                                                                </Button>
                                                                <Button
                                                                    size="small"
                                                                    variant={currentStatus === 'late' ? 'contained' : 'outlined'}
                                                                    color="warning"
                                                                    disabled={savingAttendance}
                                                                    onClick={() => handleMarkAttendance(employee, 'late')}
                                                                    sx={{ minWidth: 80 }}
                                                                >
                                                                    Muộn
                                                                </Button>
                                                                <Button
                                                                    size="small"
                                                                    variant={currentStatus === 'absent' ? 'contained' : 'outlined'}
                                                                    color="error"
                                                                    disabled={savingAttendance}
                                                                    onClick={() => handleMarkAttendance(employee, 'absent')}
                                                                    sx={{ minWidth: 80 }}
                                                                >
                                                                    Vắng
                                                                </Button>
                                                            </Stack>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        ) : (
                            <Paper elevation={2} sx={{ p: 4, borderRadius: 3, textAlign: 'center', bgcolor: alpha(COLORS.GRAY[50], 0.5) }}>
                                <Typography variant="h6" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 500, lineHeight: 1.6 }}>
                                    Nhóm này chưa có thành viên nào
                                </Typography>
                            </Paper>
                        )}
                    </Stack>
                )}
            </Container>

            {/* Note Dialog for Absent/Late */}
            <Dialog open={noteDialogOpen} onClose={() => {
                setNoteDialogOpen(false);
                setCurrentEmployee(null);
                setCurrentStatus(null);
            }} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem', letterSpacing: '-0.01em', color: currentStatus === 'absent' ? COLORS.ERROR[600] : COLORS.WARNING[600] }}>
                    {currentStatus === 'absent' ? 'Ghi chú vắng mặt' : 'Ghi chú đi muộn'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        {currentEmployee && (
                            <Typography variant="body2" sx={{ mb: 2, color: COLORS.TEXT.SECONDARY, lineHeight: 1.6, fontSize: '0.9375rem' }}>
                                Nhân viên: <strong style={{ fontWeight: 600 }}>{currentEmployee.full_name}</strong>
                            </Typography>
                        )}
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            placeholder={currentStatus === 'absent' ? 'Nhập lý do vắng mặt (bắt buộc)...' : 'Nhập lý do đi muộn (tùy chọn)...'}
                            value={attendanceNotes[currentEmployee?.id] || ''}
                            onChange={(e) => {
                                if (currentEmployee) {
                                    setAttendanceNotes(prev => ({
                                        ...prev,
                                        [currentEmployee.id]: e.target.value
                                    }));
                                }
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                }
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => {
                            setNoteDialogOpen(false);
                            setCurrentEmployee(null);
                            setCurrentStatus(null);
                        }}
                        color="inherit"
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        color={currentStatus === 'absent' ? 'error' : 'warning'}
                        onClick={handleSaveNote}
                        disabled={savingAttendance || (currentStatus === 'absent' && !attendanceNotes[currentEmployee?.id]?.trim())}
                        startIcon={savingAttendance ? <CircularProgress size={16} /> : null}
                    >
                        {savingAttendance ? 'Đang lưu...' : 'Lưu'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AttendancePage;