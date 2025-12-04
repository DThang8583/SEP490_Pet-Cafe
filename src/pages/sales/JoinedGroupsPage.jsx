import React, { useEffect, useState, useMemo } from 'react';
import { Box, Container, Grid, Card, CardContent, Typography, TextField, Chip, Button, Stack, CircularProgress, Alert, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Divider, Collapse } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { COLORS } from '../../constants/colors';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Group, Person, Work, People, ExpandMore, ExpandLess } from '@mui/icons-material';
import { authApi } from '../../api/authApi';

const TEAMS_API_URL = 'https://petcafes.azurewebsites.net/api/teams';

const JoinedGroupsPage = () => {
    const navigate = useNavigate();
    const [teams, setTeams] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [keyword, setKeyword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedTeamId, setExpandedTeamId] = useState(null);
    const [teamDetails, setTeamDetails] = useState({});
    const [loadingTeamDetails, setLoadingTeamDetails] = useState({});

    // Load current user
    useEffect(() => {
        const user = authApi.getCurrentUser();
        if (user) {
            setCurrentUser(user);
        }
    }, []);

    // Load teams from API
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
            } catch (e) {
                setError(e.message || 'Không thể tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Filter teams where current user is the leader
    const filtered = useMemo(() => {
        if (!currentUser) return [];
        
        const userFullName = currentUser.fullName || currentUser.name || '';
        if (!userFullName) return [];

        // Filter teams where leader.full_name matches user's name
        const userTeams = teams.filter(team => {
            const leaderFullName = team?.leader?.full_name || '';
            return leaderFullName === userFullName;
        });

        // Apply keyword filter
        return userTeams.filter(team => 
            (team.name || '').toLowerCase().includes(keyword.toLowerCase()) ||
            (team.description || '').toLowerCase().includes(keyword.toLowerCase())
        );
    }, [teams, currentUser, keyword]);

    const handleToggleTeamDetails = async (team) => {
        const teamId = team.id;
        
        // If already expanded, collapse it
        if (expandedTeamId === teamId) {
            setExpandedTeamId(null);
            return;
        }
        
        // Expand and load details
        setExpandedTeamId(teamId);
        
        // If details already loaded, don't fetch again
        if (teamDetails[teamId]) {
            return;
        }
        
        setLoadingTeamDetails(prev => ({ ...prev, [teamId]: true }));
        
        try {
            const token = localStorage.getItem('authToken');
            const resp = await fetch(`${TEAMS_API_URL}/${teamId}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Accept': 'application/json'
                }
            });
            
            if (!resp.ok) {
                if (resp.status === 401) {
                    throw new Error('Không có quyền truy cập. Vui lòng đăng nhập lại.');
                }
                throw new Error(`Lỗi ${resp.status}: Không thể tải chi tiết nhóm`);
            }
            
            const json = await resp.json();
            const teamData = json?.data || json;
            setTeamDetails(prev => ({ ...prev, [teamId]: teamData }));
        } catch (e) {
            // Fallback to basic team info if API fails
            setTeamDetails(prev => ({ ...prev, [teamId]: team }));
        } finally {
            setLoadingTeamDetails(prev => ({ ...prev, [teamId]: false }));
        }
    };

    return (
        <Box sx={{
            py: 3,
            minHeight: '100vh',
            background: `radial-gradient(900px 260px at -10% -10%, ${COLORS.ERROR[50]}, transparent 60%),
                         radial-gradient(900px 260px at 110% 0%, ${COLORS.INFO[50]}, transparent 60%),
                         ${COLORS.BACKGROUND.NEUTRAL}`
        }}>
            <Container maxWidth="xl">
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" sx={{ mb: 2 }} spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Group sx={{ color: COLORS.ERROR[600], fontSize: 32 }} />
                        <Typography variant="h4" sx={{ fontWeight: 900, color: COLORS.ERROR[600] }}>Nhóm đã tham gia</Typography>
                        <Chip color="error" label={`${filtered.length} nhóm`} />
                    </Stack>
                    <TextField
                        fullWidth
                        placeholder="Tìm nhóm..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        sx={{ maxWidth: 420, '& .MuiOutlinedInput-root': { borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.9)' } }}
                    />
                </Stack>

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress color="error" />
                    </Box>
                )}

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {!loading && filtered.length === 0 && !error && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Bạn chưa là leader của nhóm nào. Các nhóm mà bạn là leader sẽ hiển thị ở đây.
                    </Alert>
                )}

                {!loading && (
                    <Stack spacing={3}>
                        {filtered.map(team => {
                            const statusColor = team.status === 'ACTIVE' ? 'success' : 'default';
                            const bg = team.status === 'ACTIVE' ? '#E8F5E9' : '#F5F5F5';
                            const isExpanded = expandedTeamId === team.id;
                            const teamDetail = teamDetails[team.id];
                            const isLoadingDetail = loadingTeamDetails[team.id];
                            
                            return (
                                <Box key={team.id}>
                                    <Card sx={{
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        boxShadow: 6,
                                        transition: 'all 0.3s ease',
                                        border: isExpanded ? `2px solid ${COLORS.ERROR[400]}` : '2px solid transparent',
                                        '&:hover': { 
                                            transform: 'translateY(-2px)', 
                                            boxShadow: 10,
                                            borderColor: COLORS.ERROR[300]
                                        }
                                    }}>
                                        <Box 
                                            onClick={() => handleToggleTeamDetails(team)}
                                            sx={{ 
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                p: 3,
                                                background: `linear-gradient(135deg, ${bg} 0%, ${alpha(COLORS.ERROR[50], 0.3)} 100%)`
                                            }}
                                        >
                                            <Box sx={{ 
                                                width: 80, 
                                                height: 80, 
                                                borderRadius: 3,
                                                background: bg,
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <Group sx={{ fontSize: 48, color: COLORS.ERROR[500] }} />
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                                    <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.ERROR[600] }}>
                                                        {team.name}
                                                    </Typography>
                                                    <Chip
                                                        icon={<CheckCircle />}
                                                        label="Leader"
                                                        color="error"
                                                        size="small"
                                                        sx={{ fontWeight: 700 }}
                                                    />
                                                    <Chip 
                                                        label={team.status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
                                                        color={statusColor}
                                                        size="small"
                                                    />
                                                </Stack>
                                                <Typography sx={{ color: COLORS.TEXT.SECONDARY, mb: 1 }}>
                                                    {team.description || 'Không có mô tả'}
                                                </Typography>
                                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                                    {team.team_work_types && team.team_work_types.length > 0 && (
                                                        <Chip 
                                                            size="small" 
                                                            label={`${team.team_work_types.length} loại công việc`}
                                                        />
                                                    )}
                                                    {team.leader && (
                                                        <Chip 
                                                            size="small" 
                                                            icon={<Person />}
                                                            label={`Leader: ${team.leader.full_name}`}
                                                        />
                                                    )}
                                                </Stack>
                                            </Box>
                                            <Box>
                                                {isExpanded ? <ExpandLess sx={{ fontSize: 32, color: COLORS.ERROR[600] }} /> : <ExpandMore sx={{ fontSize: 32, color: COLORS.ERROR[600] }} />}
                                            </Box>
                                        </Box>

                                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                            <Divider />
                                            <Box sx={{ p: 3 }}>
                                                {isLoadingDetail ? (
                                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                                        <CircularProgress color="error" />
                                                    </Box>
                                                ) : teamDetail ? (
                                                    <Stack spacing={3}>
                                                        {/* Thông tin Leader */}
                                                        {teamDetail.leader && (
                                                            <Paper elevation={2} sx={{ p: 3, borderRadius: 3, bgcolor: alpha(COLORS.ERROR[50], 0.5) }}>
                                                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: COLORS.ERROR[700] }}>
                                                                    Thông tin Leader
                                                                </Typography>
                                                                <TableContainer>
                                                                    <Table>
                                                                        <TableBody>
                                                                            <TableRow>
                                                                                <TableCell sx={{ fontWeight: 700, width: '30%' }}>Avatar</TableCell>
                                                                                <TableCell>
                                                                                    <Avatar src={teamDetail.leader.avatar_url} sx={{ width: 64, height: 64 }}>
                                                                                        <Person />
                                                                                    </Avatar>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                            <TableRow>
                                                                                <TableCell sx={{ fontWeight: 700 }}>Họ và tên</TableCell>
                                                                                <TableCell>{teamDetail.leader.full_name}</TableCell>
                                                                            </TableRow>
                                                                            <TableRow>
                                                                                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                                                                <TableCell>{teamDetail.leader.email}</TableCell>
                                                                            </TableRow>
                                                                            <TableRow>
                                                                                <TableCell sx={{ fontWeight: 700 }}>Số điện thoại</TableCell>
                                                                                <TableCell>{teamDetail.leader.phone}</TableCell>
                                                                            </TableRow>
                                                                            <TableRow>
                                                                                <TableCell sx={{ fontWeight: 700 }}>Địa chỉ</TableCell>
                                                                                <TableCell>{teamDetail.leader.address || '-'}</TableCell>
                                                                            </TableRow>
                                                                            {teamDetail.leader.skills && teamDetail.leader.skills.length > 0 && (
                                                                                <TableRow>
                                                                                    <TableCell sx={{ fontWeight: 700 }}>Kỹ năng</TableCell>
                                                                                    <TableCell>
                                                                                        <Stack direction="row" spacing={1} flexWrap="wrap">
                                                                                            {teamDetail.leader.skills.map((skill, idx) => (
                                                                                                <Chip key={idx} label={skill} size="small" color="primary" />
                                                                                            ))}
                                                                                        </Stack>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            )}
                                                                        </TableBody>
                                                                    </Table>
                                                                </TableContainer>
                                                            </Paper>
                                                        )}

                                                        {/* Bảng thành viên */}
                                                        {teamDetail.team_members && teamDetail.team_members.length > 0 ? (
                                                            <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                                                                <Box sx={{ p: 2, bgcolor: COLORS.ERROR[600], color: 'white' }}>
                                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                                        <People />
                                                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                                            Thành viên nhóm ({teamDetail.team_members.length})
                                                                        </Typography>
                                                                    </Stack>
                                                                </Box>
                                                                <TableContainer>
                                                                    <Table>
                                                                        <TableHead>
                                                                            <TableRow sx={{ bgcolor: alpha(COLORS.ERROR[100], 0.5) }}>
                                                                                <TableCell sx={{ fontWeight: 700 }}>Avatar</TableCell>
                                                                                <TableCell sx={{ fontWeight: 700 }}>Họ và tên</TableCell>
                                                                                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                                                                <TableCell sx={{ fontWeight: 700 }}>Số điện thoại</TableCell>
                                                                                <TableCell sx={{ fontWeight: 700 }}>Vai trò</TableCell>
                                                                                <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                                                                                <TableCell sx={{ fontWeight: 700 }}>Kỹ năng</TableCell>
                                                                            </TableRow>
                                                                        </TableHead>
                                                                        <TableBody>
                                                                            {teamDetail.team_members.map((member, index) => (
                                                                                <TableRow 
                                                                                    key={member.id || index}
                                                                                    sx={{ 
                                                                                        '&:hover': { bgcolor: alpha(COLORS.ERROR[50], 0.3) },
                                                                                        '&:nth-of-type(even)': { bgcolor: alpha(COLORS.GRAY[50], 0.5) }
                                                                                    }}
                                                                                >
                                                                                    <TableCell>
                                                                                        <Avatar src={member.employee?.avatar_url} sx={{ width: 40, height: 40 }}>
                                                                                            <Person />
                                                                                        </Avatar>
                                                                                    </TableCell>
                                                                                    <TableCell sx={{ fontWeight: 600 }}>
                                                                                        {member.employee?.full_name || '-'}
                                                                                    </TableCell>
                                                                                    <TableCell>{member.employee?.email || '-'}</TableCell>
                                                                                    <TableCell>{member.employee?.phone || '-'}</TableCell>
                                                                                    <TableCell>
                                                                                        <Chip 
                                                                                            label={member.employee?.sub_role === 'SALE_STAFF' ? 'Nhân viên bán hàng' : 
                                                                                                   member.employee?.sub_role === 'WORKING_STAFF' ? 'Nhân viên chăm sóc' : 
                                                                                                   member.employee?.sub_role || 'Nhân viên'}
                                                                                            size="small"
                                                                                            color="info"
                                                                                        />
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <Chip 
                                                                                            label={member.employee?.is_active ? 'Hoạt động' : 'Không hoạt động'}
                                                                                            size="small"
                                                                                            color={member.employee?.is_active ? 'success' : 'default'}
                                                                                        />
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        {member.employee?.skills && member.employee.skills.length > 0 ? (
                                                                                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                                                                                {member.employee.skills.map((skill, idx) => (
                                                                                                    <Chip key={idx} label={skill} size="small" variant="outlined" />
                                                                                                ))}
                                                                                            </Stack>
                                                                                        ) : '-'}
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                        </TableBody>
                                                                    </Table>
                                                                </TableContainer>
                                                            </Paper>
                                                        ) : (
                                                            <Paper elevation={2} sx={{ p: 3, borderRadius: 3, textAlign: 'center', bgcolor: alpha(COLORS.GRAY[50], 0.5) }}>
                                                                <Typography sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                                    Nhóm này chưa có thành viên nào
                                                                </Typography>
                                                            </Paper>
                                                        )}

                                                        {/* Loại công việc */}
                                                        {teamDetail.team_work_types && teamDetail.team_work_types.length > 0 && (
                                                            <Paper elevation={2} sx={{ p: 3, borderRadius: 3, bgcolor: alpha(COLORS.INFO[50], 0.5) }}>
                                                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: COLORS.INFO[700] }}>
                                                                    Loại công việc ({teamDetail.team_work_types.length})
                                                                </Typography>
                                                                <Stack spacing={2}>
                                                                    {teamDetail.team_work_types.map((twt, index) => (
                                                                        <Box key={twt.id || index} sx={{ p: 2, bgcolor: 'white', borderRadius: 2 }}>
                                                                            <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                                                                                {twt.work_type?.name || 'Không có tên'}
                                                                            </Typography>
                                                                            <Typography variant="body2" sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                                                {twt.work_type?.description || 'Không có mô tả'}
                                                                            </Typography>
                                                                        </Box>
                                                                    ))}
                                                                </Stack>
                                                            </Paper>
                                                        )}
                                                    </Stack>
                                                ) : (
                                                    <Box sx={{ textAlign: 'center', py: 2 }}>
                                                        <Typography sx={{ color: COLORS.TEXT.SECONDARY }}>
                                                            Click để xem chi tiết
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Collapse>
                                    </Card>
                                </Box>
                            );
                        })}
                    </Stack>
                )}
            </Container>

        </Box>
    );
};

export default JoinedGroupsPage;

