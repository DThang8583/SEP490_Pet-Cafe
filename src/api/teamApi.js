import { MOCK_TEAMS, MOCK_EMPLOYEES, MOCK_WORK_TYPES, MOCK_WORK_SHIFTS, MOCK_TEAM_MEMBERS, MOCK_TEAM_WORK_SHIFTS } from './mockData';

// Delay to simulate API call
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock getCurrentUser
const getCurrentUser = () => {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
};

// Permission check
const checkPermission = (user, permission) => {
    if (!user) return false;
    const role = user.role || user.account?.role;
    if (role && role.toUpperCase() === 'MANAGER') return true;
    return false;
};

// Generate ID
const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Helper: Get employee by ID
const getEmployeeById = (id) => {
    return MOCK_EMPLOYEES.find(e => e.id === id && !e.is_deleted);
};

// Helper: Get work type by ID
const getWorkTypeById = (id) => {
    return MOCK_WORK_TYPES.find(wt => wt.id === id && !wt.is_deleted);
};

// Helper: Get work shift by ID
const getWorkShiftById = (id) => {
    return MOCK_WORK_SHIFTS.find(ws => ws.id === id && !ws.is_deleted);
};

// Helper: Populate team_work_shifts (for list view)
const populateTeamWorkShifts = (teamId) => {
    const teamWorkShifts = MOCK_TEAM_WORK_SHIFTS.filter(tws => tws.team_id === teamId && !tws.is_deleted);

    return teamWorkShifts.map(tws => {
        const workShift = getWorkShiftById(tws.work_shift_id);
        if (!workShift) return null;

        return {
            team_id: tws.team_id,
            work_shift_id: tws.work_shift_id,
            team: null,
            work_shift: {
                name: workShift.name,
                start_time: workShift.start_time,
                end_time: workShift.end_time,
                description: workShift.description,
                is_active: workShift.is_active,
                applicable_days: workShift.applicable_days,
                team_work_shifts: [null],
                daily_schedules: [],
                id: workShift.id,
                created_at: workShift.created_at,
                created_by: workShift.created_by,
                updated_at: workShift.updated_at,
                updated_by: workShift.updated_by,
                is_deleted: workShift.is_deleted
            },
            id: tws.id,
            created_at: tws.created_at,
            created_by: tws.created_by,
            updated_at: tws.updated_at,
            updated_by: tws.updated_by,
            is_deleted: tws.is_deleted
        };
    }).filter(Boolean);
};

// Helper: Populate leader info (for list view)
const populateLeader = (team) => {
    if (!team.leader_id) return null;

    const employee = getEmployeeById(team.leader_id);
    if (!employee) return null;

    return {
        account_id: employee.account_id,
        full_name: employee.full_name,
        avatar_url: employee.avatar_url,
        email: employee.email,
        phone: employee.phone,
        address: employee.address,
        skills: employee.skills,
        salary: employee.salary,
        sub_role: employee.sub_role,
        account: null,
        team_members: [],
        orders: [],
        daily_schedules: [],
        id: employee.id,
        created_at: employee.created_at,
        created_by: employee.created_by,
        updated_at: employee.updated_at,
        updated_by: employee.updated_by,
        is_deleted: employee.is_deleted
    };
};

// Helper: Populate team_work_types (for list view)
const populateTeamWorkTypes = (teamId) => {
    const createTeamWorkType = (teamId, workTypeId, id, createdAt) => {
        const workType = getWorkTypeById(workTypeId);
        if (!workType) return null;

        return {
            team_id: teamId,
            work_type_id: workType.id,
            description: null,
            team: null,
            work_type: {
                name: workType.name,
                description: workType.description,
                is_active: workType.is_active,
                tasks: [],
                area_work_types: [],
                team_work_types: [null],
                id: workType.id,
                created_at: workType.created_at,
                created_by: workType.created_by,
                updated_at: workType.updated_at,
                updated_by: workType.updated_by,
                is_deleted: workType.is_deleted
            },
            id: id,
            created_at: createdAt,
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: createdAt,
            updated_by: null,
            is_deleted: false
        };
    };

    // Cat Zone Care Team
    if (teamId === '73db584f-89ba-4ac0-ae2e-4c559a907775') {
        const teamWorkType = createTeamWorkType(
            teamId,
            '7e7477a6-f481-4df6-b3fd-626944475fb5', // Cat Zone Management
            '31e7c4be-908d-4ceb-83a9-50cae94fa0fc',
            '2025-10-27T13:01:10.34081+00:00'
        );
        return teamWorkType ? [teamWorkType] : [];
    }
    // Sales & F&B Team
    else if (teamId === '4d55bbb0-a1c1-4c03-98bf-c587f0713512') {
        const teamWorkType = createTeamWorkType(
            teamId,
            '057b182b-94e1-477e-8362-e89df03c2faf', // Food & Beverage
            '096a41a6-1369-4b6a-9c4e-2b6ef8f5728a',
            '2025-10-27T13:03:17.644602+00:00'
        );
        return teamWorkType ? [teamWorkType] : [];
    }
    // Dog Zone Care Team
    else if (teamId === 'a1b2c3d4-e5f6-4789-a012-bcdef3456789') {
        const teamWorkType = createTeamWorkType(
            teamId,
            'b0c8a471-3b55-4038-9642-b598c072ea45', // Dog Zone Management
            'twt-dog-1',
            '2025-10-28T08:00:00.000000+00:00'
        );
        return teamWorkType ? [teamWorkType] : [];
    }
    // Grooming Team
    else if (teamId === 'b2c3d4e5-f6a7-4890-b123-cdef45678901') {
        const teamWorkType = createTeamWorkType(
            teamId,
            '7e7477a6-f481-4df6-b3fd-626944475fb5', // Cat Zone Management (grooming for all pets)
            'twt-groom-1',
            '2025-10-28T08:15:00.000000+00:00'
        );
        return teamWorkType ? [teamWorkType] : [];
    }
    // VIP Service Team
    else if (teamId === 'c3d4e5f6-a7b8-4901-c234-def567890123') {
        const teamWorkType = createTeamWorkType(
            teamId,
            '057b182b-94e1-477e-8362-e89df03c2faf', // Food & Beverage
            'twt-vip-1',
            '2025-10-28T08:30:00.000000+00:00'
        );
        return teamWorkType ? [teamWorkType] : [];
    }
    // Outdoor Garden Team
    else if (teamId === 'd4e5f6a7-b8c9-4012-d345-ef6789012345') {
        const teamWorkType = createTeamWorkType(
            teamId,
            '7e7477a6-f481-4df6-b3fd-626944475fb5', // Cat Zone Management (general pet care)
            'twt-outdoor-1',
            '2025-10-28T08:45:00.000000+00:00'
        );
        return teamWorkType ? [teamWorkType] : [];
    }
    // Customer Service Team
    else if (teamId === 'e5f6a7b8-c9d0-4123-e456-f78901234567') {
        const teamWorkType = createTeamWorkType(
            teamId,
            '057b182b-94e1-477e-8362-e89df03c2faf', // Food & Beverage (customer service)
            'twt-cs-1',
            '2025-10-28T09:00:00.000000+00:00'
        );
        return teamWorkType ? [teamWorkType] : [];
    }

    return [];
};

// Helper: Populate team_members (for detail view and list view)
const populateTeamMembers = (teamId) => {
    // Filter team members by team_id
    const teamMembers = MOCK_TEAM_MEMBERS.filter(tm => tm.team_id === teamId && !tm.is_deleted);

    // Populate employee data for each member
    return teamMembers.map(tm => {
        const employee = getEmployeeById(tm.employee_id);

        if (!employee) return null;

        return {
            team_id: tm.team_id,
            employee_id: tm.employee_id,
            is_active: tm.is_active,
            team: null,
            employee: {
                account_id: employee.account_id,
                full_name: employee.full_name,
                avatar_url: employee.avatar_url,
                email: employee.email,
                phone: employee.phone,
                address: employee.address,
                skills: employee.skills,
                salary: employee.salary,
                sub_role: employee.sub_role,
                account: null,
                team_members: [null],
                orders: [],
                daily_schedules: [],
                id: employee.id,
                created_at: employee.created_at,
                created_by: employee.created_by,
                updated_at: employee.updated_at,
                updated_by: employee.updated_by,
                is_deleted: employee.is_deleted
            },
            daily_schedules: [],
            id: tm.id,
            created_at: tm.created_at,
            created_by: tm.created_by,
            updated_at: tm.updated_at,
            updated_by: tm.updated_by,
            is_deleted: tm.is_deleted
        };
    }).filter(tm => tm !== null); // Remove null entries
};

/**
 * Get all teams
 */
export const getTeams = async () => {
    await delay(500);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền truy cập');
    }

    const teams = MOCK_TEAMS.filter(t => !t.is_deleted).map(team => ({
        ...team,
        leader: populateLeader(team),
        team_members: populateTeamMembers(team.id),
        team_work_types: populateTeamWorkTypes(team.id),
        team_work_shifts: populateTeamWorkShifts(team.id)
    }));

    return {
        success: true,
        data: teams,
        pagination: {
            total_items_count: teams.length,
            page_size: 10,
            total_pages_count: 1,
            page_index: 0,
            has_next: false,
            has_previous: false
        }
    };
};

/**
 * Get team by ID (detail)
 */
export const getTeamById = async (id) => {
    await delay(300);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền truy cập');
    }

    const team = MOCK_TEAMS.find(t => t.id === id && !t.is_deleted);
    if (!team) {
        throw new Error('Không tìm thấy nhóm');
    }

    return {
        success: true,
        data: {
            ...team,
            leader: populateLeader(team),
            team_members: populateTeamMembers(team.id),
            team_work_types: populateTeamWorkTypes(team.id)
        }
    };
};

/**
 * Get work types of a team (returns array of work types directly)
 */
export const getTeamWorkTypes = async (teamId) => {
    await delay(300);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền truy cập');
    }

    // Get team_work_types for this team and extract work_type objects
    const teamWorkTypes = populateTeamWorkTypes(teamId);
    const workTypes = teamWorkTypes.map(twt => twt.work_type).filter(wt => wt !== null);

    return {
        success: true,
        data: workTypes
    };
};

/**
 * Get work shifts of a team
 */
export const getTeamWorkShifts = async (teamId) => {
    await delay(300);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền truy cập');
    }

    // For now, return hardcoded based on team
    // In real app, this would filter MOCK_WORK_SHIFTS based on team_work_shifts relationship
    const shifts = MOCK_WORK_SHIFTS.filter(ws => !ws.is_deleted);

    return {
        success: true,
        data: shifts,
        pagination: {
            total_items_count: shifts.length,
            page_size: 10,
            total_pages_count: 1,
            page_index: 0,
            has_next: false,
            has_previous: false
        }
    };
};

/**
 * Get slots of a team
 */
export const getTeamSlots = async (teamId) => {
    await delay(300);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền truy cập');
    }

    // Import MOCK_SLOTS - for now hardcoded
    // In real implementation, this would filter slots by team_id
    const slots = [];

    // Hardcoded slots for Cat Zone Care Team
    if (teamId === '73db584f-89ba-4ac0-ae2e-4c559a907775') {
        slots.push({
            id: '727d444e-6311-4377-86f9-acf24428dafd',
            service_id: 'caa26439-478e-4892-861f-1aab0a41ba4b',
            task_id: 'cfa75dab-16cf-4978-b9fb-e6da47034108',
            area_id: '0a10e6b3-085d-42f2-b218-8474302d72b4',
            team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
            pet_group_id: 'ca287dab-96a8-4922-86d5-1c2a99cc34ed',
            pet_id: null,
            start_time: '07:30:00',
            end_time: '12:00:00',
            max_capacity: 25,
            price: 0,
            day_of_week: 'MONDAY',
            service_status: 'AVAILABLE',
            special_notes: 'Ưu tiên dọn dẹp hộp cát và thay nước, sau đó mới cho ăn bữa sáng.',
            created_at: '2025-10-27T15:51:13.048693+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-27T16:26:49.809364+00:00',
            updated_by: '00000000-0000-0000-0000-000000000000',
            is_deleted: false
        });

        slots.push({
            id: '63013ef8-066c-4b45-b0e2-603556900ca8',
            service_id: 'caa26439-478e-4892-861f-1aab0a41ba4b',
            task_id: 'cfa75dab-16cf-4978-b9fb-e6da47034108',
            area_id: '0a10e6b3-085d-42f2-b218-8474302d72b4',
            team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
            pet_group_id: 'ca287dab-96a8-4922-86d5-1c2a99cc34ed',
            pet_id: null,
            start_time: '07:30:00',
            end_time: '12:00:00',
            max_capacity: 25,
            price: 0,
            day_of_week: 'TUESDAY',
            service_status: 'UNAVAILABLE',
            special_notes: '28',
            created_at: '2025-10-28T16:26:12.924117+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-28T16:26:12.924117+00:00',
            updated_by: null,
            is_deleted: false
        });
    }

    return {
        success: true,
        data: slots,
        pagination: {
            total_items_count: slots.length,
            page_size: 10,
            total_pages_count: 1,
            page_index: 0,
            has_next: false,
            has_previous: false
        }
    };
};

/**
 * Get all slots (for all teams)
 */
export const getAllTeamSlots = async () => {
    await delay(300);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền truy cập');
    }

    // Generate slots dynamically from team work shifts
    const slots = [];

    MOCK_TEAM_WORK_SHIFTS.filter(tws => !tws.is_deleted).forEach(tws => {
        const workShift = getWorkShiftById(tws.work_shift_id);
        if (!workShift) return;

        // Create a slot for each applicable day
        if (workShift.applicable_days && workShift.applicable_days.length > 0) {
            workShift.applicable_days.forEach(day => {
                slots.push({
                    id: `slot-${tws.id}-${day}`,
                    team_id: tws.team_id,
                    start_time: workShift.start_time,
                    end_time: workShift.end_time,
                    day_of_week: day,
                    service_status: 'AVAILABLE',
                    special_notes: null,
                    created_at: tws.created_at,
                    is_deleted: false
                });
            });
        }
    });

    return {
        success: true,
        data: slots.filter(s => !s.is_deleted),
        pagination: {
            total_items_count: slots.filter(s => !s.is_deleted).length,
            page_size: 10,
            total_pages_count: 1,
            page_index: 0,
            has_next: false,
            has_previous: false
        }
    };
};

/**
 * Create team
 * API: { name, description, leader_id, work_type_ids[] }
 */
export const createTeam = async (teamData) => {
    await delay(700);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền tạo nhóm');
    }

    // Validation
    if (!teamData.name) throw new Error('Tên nhóm là bắt buộc');
    if (!teamData.description) throw new Error('Mô tả là bắt buộc');
    if (!teamData.leader_id) throw new Error('Trưởng nhóm là bắt buộc');
    if (!teamData.work_type_ids || teamData.work_type_ids.length === 0) {
        throw new Error('Phải chọn ít nhất một loại công việc');
    }

    // Verify leader exists
    const leader = getEmployeeById(teamData.leader_id);
    if (!leader) throw new Error('Trưởng nhóm không tồn tại');

    // Verify work types exist
    const invalidWorkTypes = teamData.work_type_ids.filter(wtId => !getWorkTypeById(wtId));
    if (invalidWorkTypes.length > 0) {
        throw new Error('Một số loại công việc không tồn tại');
    }

    const newTeam = {
        id: generateId(),
        name: teamData.name,
        description: teamData.description,
        leader_id: teamData.leader_id,
        is_active: true, // Default active
        status: 'INACTIVE', // Default status
        leader: null,
        team_members: [],
        bookings: [],
        slots: [],
        daily_tasks: [],
        team_work_shifts: [],
        team_work_types: [],
        created_at: new Date().toISOString(),
        created_by: currentUser?.id || '00000000-0000-0000-0000-000000000000',
        updated_at: new Date().toISOString(),
        updated_by: null,
        is_deleted: false
    };

    MOCK_TEAMS.push(newTeam);

    // TODO: Create team_work_types entries based on work_type_ids
    // This would be done in the backend

    return {
        success: true,
        data: newTeam,
        message: 'Tạo nhóm thành công'
    };
};

/**
 * Update team
 * API: { name, description, leader_id, work_type_ids[], is_active }
 */
export const updateTeam = async (id, teamData) => {
    await delay(700);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền cập nhật nhóm');
    }

    const teamIndex = MOCK_TEAMS.findIndex(t => t.id === id && !t.is_deleted);
    if (teamIndex === -1) {
        throw new Error('Không tìm thấy nhóm');
    }

    const team = MOCK_TEAMS[teamIndex];

    // If leader_id is being updated, verify it exists
    if (teamData.leader_id && teamData.leader_id !== team.leader_id) {
        const leader = getEmployeeById(teamData.leader_id);
        if (!leader) throw new Error('Trưởng nhóm không tồn tại');
    }

    // If work_type_ids is being updated, verify they exist
    if (teamData.work_type_ids) {
        const invalidWorkTypes = teamData.work_type_ids.filter(wtId => !getWorkTypeById(wtId));
        if (invalidWorkTypes.length > 0) {
            throw new Error('Một số loại công việc không tồn tại');
        }
    }

    const updatedTeam = {
        ...team,
        name: teamData.name !== undefined ? teamData.name : team.name,
        description: teamData.description !== undefined ? teamData.description : team.description,
        leader_id: teamData.leader_id !== undefined ? teamData.leader_id : team.leader_id,
        is_active: teamData.is_active !== undefined ? teamData.is_active : team.is_active,
        updated_at: new Date().toISOString(),
        updated_by: currentUser?.id || '00000000-0000-0000-0000-000000000000'
    };

    MOCK_TEAMS[teamIndex] = updatedTeam;

    // TODO: Update team_work_types based on work_type_ids
    // This would be done in the backend

    return {
        success: true,
        data: updatedTeam,
        message: 'Cập nhật nhóm thành công'
    };
};

/**
 * Delete team (soft delete)
 */
export const deleteTeam = async (id) => {
    await delay(500);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền xóa nhóm');
    }

    const teamIndex = MOCK_TEAMS.findIndex(t => t.id === id && !t.is_deleted);
    if (teamIndex === -1) {
        throw new Error('Không tìm thấy nhóm');
    }

    // Soft delete
    MOCK_TEAMS[teamIndex].is_deleted = true;
    MOCK_TEAMS[teamIndex].updated_at = new Date().toISOString();
    MOCK_TEAMS[teamIndex].updated_by = currentUser?.id || '00000000-0000-0000-0000-000000000000';

    return {
        success: true,
        message: 'Xóa nhóm thành công'
    };
};

/**
 * Get team members (returns array of team_member objects with employee data)
 * IMPORTANT: Leader must always be included in the team members list
 */
export const getTeamMembers = async (teamId) => {
    await delay(300);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền truy cập');
    }

    // Get team to find leader
    const team = MOCK_TEAMS.find(t => t.id === teamId && !t.is_deleted);
    if (!team) {
        throw new Error('Không tìm thấy nhóm');
    }

    let members = populateTeamMembers(teamId);

    // IMPORTANT: Add leader to members list if not already there
    if (team.leader_id) {
        const leaderAlreadyInMembers = members.some(m => m.employee_id === team.leader_id);

        if (!leaderAlreadyInMembers) {
            const leader = getEmployeeById(team.leader_id);
            if (leader) {
                // Create a team_member entry for the leader
                const leaderMember = {
                    team_id: teamId,
                    employee_id: leader.id,
                    is_active: true, // Leader is always active
                    team: null,
                    employee: {
                        account_id: leader.account_id,
                        full_name: leader.full_name,
                        avatar_url: leader.avatar_url,
                        email: leader.email,
                        phone: leader.phone,
                        address: leader.address,
                        skills: leader.skills,
                        salary: leader.salary,
                        sub_role: leader.sub_role,
                        account: null,
                        team_members: [null],
                        orders: [],
                        daily_schedules: [],
                        id: leader.id,
                        created_at: leader.created_at,
                        created_by: leader.created_by,
                        updated_at: leader.updated_at,
                        updated_by: leader.updated_by,
                        is_deleted: leader.is_deleted
                    },
                    daily_schedules: [],
                    id: `leader-member-${teamId}`, // Special ID for leader entry
                    created_at: team.created_at,
                    created_by: team.created_by,
                    updated_at: team.updated_at,
                    updated_by: team.updated_by,
                    is_deleted: false
                };

                // Add leader at the beginning of the list
                members = [leaderMember, ...members];
            }
        }
    }

    return {
        success: true,
        data: members
    };
};

/**
 * Add members to team
 * API: [{ employee_id }]
 */
export const addTeamMembers = async (teamId, members) => {
    await delay(500);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền thêm thành viên');
    }

    // Verify team exists
    const team = MOCK_TEAMS.find(t => t.id === teamId && !t.is_deleted);
    if (!team) {
        throw new Error('Không tìm thấy nhóm');
    }

    // Validate and add members
    const addedMembers = [];
    for (const member of members) {
        if (!member.employee_id) {
            throw new Error('employee_id là bắt buộc');
        }

        // Verify employee exists
        const employee = getEmployeeById(member.employee_id);
        if (!employee) {
            throw new Error(`Nhân viên ${member.employee_id} không tồn tại`);
        }

        // Check if already a member
        const existingMember = MOCK_TEAM_MEMBERS.find(
            tm => tm.team_id === teamId && tm.employee_id === member.employee_id && !tm.is_deleted
        );
        if (existingMember) {
            throw new Error(`${employee.full_name} đã là thành viên của nhóm`);
        }

        // Create new team member
        const newMember = {
            id: generateId(),
            team_id: teamId,
            employee_id: member.employee_id,
            is_active: true,
            team: null,
            employee: null,
            daily_schedules: [],
            created_at: new Date().toISOString(),
            created_by: currentUser?.id || '00000000-0000-0000-0000-000000000000',
            updated_at: new Date().toISOString(),
            updated_by: null,
            is_deleted: false
        };

        MOCK_TEAM_MEMBERS.push(newMember);
        addedMembers.push(newMember);
    }

    return {
        success: true,
        data: addedMembers,
        message: `Đã thêm ${addedMembers.length} thành viên vào nhóm`
    };
};

/**
 * Update team members
 * API: [{ employee_id, is_active }]
 */
export const updateTeamMembers = async (teamId, members) => {
    await delay(500);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền cập nhật thành viên');
    }

    // Verify team exists
    const team = MOCK_TEAMS.find(t => t.id === teamId && !t.is_deleted);
    if (!team) {
        throw new Error('Không tìm thấy nhóm');
    }

    const updatedMembers = [];
    for (const memberUpdate of members) {
        if (!memberUpdate.employee_id) {
            throw new Error('employee_id là bắt buộc');
        }

        // Find existing team member
        const memberIndex = MOCK_TEAM_MEMBERS.findIndex(
            tm => tm.team_id === teamId && tm.employee_id === memberUpdate.employee_id && !tm.is_deleted
        );

        if (memberIndex === -1) {
            throw new Error(`Nhân viên không thuộc nhóm này`);
        }

        // Update member
        MOCK_TEAM_MEMBERS[memberIndex] = {
            ...MOCK_TEAM_MEMBERS[memberIndex],
            is_active: memberUpdate.is_active !== undefined ? memberUpdate.is_active : MOCK_TEAM_MEMBERS[memberIndex].is_active,
            updated_at: new Date().toISOString(),
            updated_by: currentUser?.id || '00000000-0000-0000-0000-000000000000'
        };

        updatedMembers.push(MOCK_TEAM_MEMBERS[memberIndex]);
    }

    return {
        success: true,
        data: updatedMembers,
        message: 'Cập nhật thành viên thành công'
    };
};

/**
 * Remove member from team
 */
export const removeTeamMember = async (teamId, employeeId) => {
    await delay(500);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền xóa thành viên');
    }

    const memberIndex = MOCK_TEAM_MEMBERS.findIndex(
        tm => tm.team_id === teamId && tm.employee_id === employeeId && !tm.is_deleted
    );

    if (memberIndex === -1) {
        throw new Error('Không tìm thấy thành viên trong nhóm');
    }

    // Soft delete
    MOCK_TEAM_MEMBERS[memberIndex].is_deleted = true;
    MOCK_TEAM_MEMBERS[memberIndex].updated_at = new Date().toISOString();
    MOCK_TEAM_MEMBERS[memberIndex].updated_by = currentUser?.id || '00000000-0000-0000-0000-000000000000';

    return {
        success: true,
        message: 'Xóa thành viên khỏi nhóm thành công'
    };
};

/**
 * Assign work shifts to team
 * API: { work_shift_id: [...] }
 */
export const assignTeamWorkShifts = async (teamId, data) => {
    await delay(500);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'team_management')) {
        throw new Error('Không có quyền phân công ca làm việc');
    }

    // Verify team exists
    const team = MOCK_TEAMS.find(t => t.id === teamId && !t.is_deleted);
    if (!team) {
        throw new Error('Không tìm thấy nhóm');
    }

    if (!data.work_shift_id || data.work_shift_id.length === 0) {
        throw new Error('Phải chọn ít nhất một ca làm việc');
    }

    // Verify all work shifts exist
    const invalidShifts = data.work_shift_id.filter(wsId => {
        return !MOCK_WORK_SHIFTS.find(ws => ws.id === wsId && !ws.is_deleted);
    });

    if (invalidShifts.length > 0) {
        throw new Error('Một số ca làm việc không tồn tại');
    }

    // TODO: Create team_work_shifts entries
    // This would be done in the backend

    return {
        success: true,
        message: `Đã phân công ${data.work_shift_id.length} ca làm việc cho nhóm`
    };
};

export default {
    getTeams,
    getTeamById,
    getTeamWorkTypes,
    getTeamMembers,
    getTeamWorkShifts,
    getTeamSlots,
    getAllTeamSlots,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMembers,
    updateTeamMembers,
    removeTeamMember,
    assignTeamWorkShifts
};

