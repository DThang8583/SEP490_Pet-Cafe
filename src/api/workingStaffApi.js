import apiClient from '../config/config';
import { authApi } from './authApi';
import { getDailySchedules } from './dailyScheduleApi';
import { getDailyTasksFromAPI, updateDailyTaskStatus as updateDailyTaskStatusAPI } from './dailyTasksApi';
import { getTeams, getTeamMembers, getTeamWorkShifts } from './teamApi';

const normalizeDate = (date) => {
    if (!date) return new Date().toISOString().split('T')[0];
    if (date instanceof Date) return date.toISOString().split('T')[0];
    return date;
};

const getProfile = () => {
    const currentUser = authApi.getCurrentUser();
    if (!currentUser) {
        throw new Error('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
    }
    return {
        ...currentUser,
        leader: currentUser.permissions?.includes('shift_management') || currentUser.permissions?.includes('team_lead'),
        name: currentUser.full_name || currentUser.name,
        avatar: currentUser.avatar || currentUser.avatar_url
    };
};

const buildCandidateIds = (profile = {}) => {
    const ids = [
        profile?.id,
        profile?.employee_id,
        profile?.account_id,
        profile?.account?.id,
        profile?.account?.account_id,
        profile?.employee?.id,
        profile?.employee?.employee_id,
        profile?.employee?.account_id
    ];
    return Array.from(new Set(ids.filter(Boolean)));
};

const workingStaffApi = {
    getProfile,

    async getMyTeams() {
        const profile = getProfile();
        const candidateIds = buildCandidateIds(profile);

        try {
            let pageIndex = 0;
            const pageSize = 50;
            let hasNext = true;
            const allTeams = [];

            while (hasNext) {
                const response = await getTeams({ page_index: pageIndex, page_size: pageSize });
                const teams = response.data || [];
                allTeams.push(...teams);
                const pagination = response.pagination || {};
                hasNext = Boolean(pagination.has_next);
                pageIndex += 1;
                if (!hasNext) break;
            }

            const teamsWithMembers = await Promise.all(
                allTeams.map(async (team) => {
                    try {
                        const [membersResp, workShiftsResp] = await Promise.allSettled([
                            getTeamMembers(team.id),
                            getTeamWorkShifts(team.id, { page_index: 0, page_size: 100 })
                        ]);
                        const members = membersResp.status === 'fulfilled' ? membersResp.value.data || [] : [];
                        const teamWorkShifts = workShiftsResp.status === 'fulfilled' ? workShiftsResp.value.data || [] : [];
                        return {
                            ...team,
                            members,
                            team_work_shifts: teamWorkShifts
                        };
                    } catch (error) {
                        console.warn('Load team data failed', error);
                        return {
                            ...team,
                            members: [],
                            team_work_shifts: []
                        };
                    }
                })
            );

            const filtered = teamsWithMembers.filter((team) => {
                const leaderAccountId = team.leader?.account_id;
                const isLeaderMatch =
                    (team.leader_id && candidateIds.includes(team.leader_id)) ||
                    (leaderAccountId && candidateIds.includes(leaderAccountId));

                if (isLeaderMatch) {
                    return true;
                }

                if (Array.isArray(team.members) && team.members.length > 0) {
                    return team.members.some((m) => {
                        const memberEmployeeId = m.employee_id || m.employee?.id;
                        const memberAccountId = m.employee?.account_id;
                        return (
                            (memberEmployeeId && candidateIds.includes(memberEmployeeId)) ||
                            (memberAccountId && candidateIds.includes(memberAccountId))
                        );
                    });
                }
                return false;
            });

            return filtered;
        } catch (error) {
            console.warn('workingStaffApi.getMyTeams error', error);
            return [];
        }
    },

    async getMySchedules(date) {
        const profile = getProfile();
        const filterDate = normalizeDate(date);
        try {
            const response = await getDailySchedules({
                page_index: 0,
                page_size: 100,
                FromDate: filterDate,
                ToDate: filterDate
            });

            const schedules = (response.data || []).filter((schedule) => {
                const empId = schedule.employee_id || schedule.employee?.id || schedule.staff_id;
                return !empId || empId === profile.id || empId === profile.employee_id;
            });

            return schedules;
        } catch (error) {
            console.warn('workingStaffApi.getMySchedules error', error);
            return [];
        }
    },

    async getTeamDailyTasks(teamId, date) {
        const targetDate = normalizeDate(date);
        try {
            const response = await getDailyTasksFromAPI({
                page_index: 0,
                page_size: 200,
                TeamId: teamId || undefined,
                FromDate: targetDate,
                ToDate: targetDate
            });
            return response.data || [];
        } catch (error) {
            console.warn('workingStaffApi.getTeamDailyTasks error', error);
            return [];
        }
    },

    async getTeamDailyTasksInRange(teamId, fromDate, toDate) {
        const from = normalizeDate(fromDate);
        const to = normalizeDate(toDate);
        try {
            const response = await getDailyTasksFromAPI({
                page_index: 0,
                page_size: 1000,
                TeamId: teamId || undefined,
                FromDate: from,
                ToDate: to
            });
            return response.data || [];
        } catch (error) {
            console.warn('workingStaffApi.getTeamDailyTasksInRange error', error);
            return [];
        }
    },

    async getAttendance(teamId, date) {
        if (!teamId) return [];
        const targetDate = normalizeDate(date);
        try {
            const response = await getDailySchedules({
                page_index: 0,
                page_size: 500,
                TeamId: teamId,
                FromDate: targetDate,
                ToDate: targetDate
            });
            return response.data || [];
        } catch (error) {
            console.warn('workingStaffApi.getAttendance error', error);
            return [];
        }
    },

    async updateAttendanceStatus(entry, status, note = '') {
        const teamId = entry?.team_id || entry?.team?.id;
        if (!teamId) {
            throw new Error('Thiếu thông tin team cho ca làm việc.');
        }
        try {
            const payload = [{
                id: entry.id,
                status,
                notes: note
            }];
            const response = await apiClient.put(`/teams/${teamId}/daily-schedules`, payload, {
                timeout: 10000,
                headers: { 'Content-Type': 'application/json' }
            });
            return response.data;
        } catch (error) {
            console.warn('workingStaffApi.updateAttendanceStatus error', error);
            throw error;
        }
    },

    async updateDailyTaskStatus(taskId, status) {
        try {
            const response = await updateDailyTaskStatusAPI(taskId, { status });
            return response?.data || null;
        } catch (error) {
            console.warn('Failed to update daily task status:', error);
            throw error;
        }
    },

    async getBookings() {
        // TODO: Replace with official booking endpoint when available
        return [];
    },

    async updateBookingStatus() {
        // TODO: Replace with official booking endpoint when available
        throw new Error('Chức năng cập nhật booking chưa được kết nối API chính thức.');
    },

    async getTaskDetail(taskId) {
        if (!taskId) return null;
        const tasks = await this.getTeamDailyTasks(null, new Date());
        return tasks.find((t) => t.id === taskId) || null;
    }
};

export default workingStaffApi;

