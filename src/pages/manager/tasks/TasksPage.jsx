import React, { useEffect, useState } from 'react';
import { Box, Typography, Stack, Chip, Button } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Add } from '@mui/icons-material';
import { COLORS } from '../../../constants/colors';
import Loading from '../../../components/loading/Loading';
import ConfirmModal from '../../../components/modals/ConfirmModal';

// Task components
import TaskList from './TaskList';
import TaskWizard from './TaskWizard';
import TaskDetailsDialog from './TaskDetailsDialog';

// API
import { getAllTasksData } from '../../../api/tasksApi';

const TasksPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [wizardOpen, setWizardOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [detailsTask, setDetailsTask] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);

    // Task data
    const [services, setServices] = useState([]);
    const [areas, setAreas] = useState([]);
    const [staff, setStaff] = useState([]);
    const [petGroupNames, setPetGroupNames] = useState([]);
    const [petGroupsMap, setPetGroupsMap] = useState({});

    useEffect(() => {
        // Load tasks data
        const loadData = async () => {
            try {
                const data = await getAllTasksData();
                setServices(data.services);
                setAreas(data.areas);
                setStaff(data.staff);
                setPetGroupNames(data.petGroupNames);
                setPetGroupsMap(data.petGroupsMap);
            } catch (error) {
                console.error('Failed to load tasks data', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();

        // Load tasks from localStorage
        const saved = localStorage.getItem('mgr_tasks_v2');
        if (saved) {
            try {
                setTasks(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse tasks', e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('mgr_tasks_v2', JSON.stringify(tasks));
    }, [tasks]);

    const handleCreateTask = (newTask) => {
        setTasks(prev => [...prev, newTask]);
    };

    const handleUpdateTask = (updatedTask) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setWizardOpen(true);
    };

    const handleDeleteTask = (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        setTaskToDelete(task);
        setConfirmDeleteOpen(true);
    };

    const confirmDeleteTask = () => {
        if (taskToDelete) {
            setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
        }
        setConfirmDeleteOpen(false);
        setTaskToDelete(null);
    };

    const handleCloseWizard = () => {
        setWizardOpen(false);
        setEditingTask(null);
    };

    const handleViewTask = (task) => {
        setDetailsTask(task);
        setDetailsOpen(true);
    };

    if (isLoading) {
        return <Loading message="Đang tải..." fullScreen />;
    }

    return (
        <Box sx={{ background: COLORS.BACKGROUND.NEUTRAL, minHeight: '100vh', width: '100%' }}>
            <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
                {/* Header */}
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.ERROR[600] }}>
                        Quản lý nhiệm vụ
                    </Typography>
                    <Chip
                        label={`${tasks.length} nhiệm vụ`}
                        size="small"
                        sx={{ background: alpha(COLORS.SECONDARY[100], 0.7), color: COLORS.SECONDARY[800], fontWeight: 700 }}
                    />
                    <Box sx={{ flexGrow: 1 }} />
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setWizardOpen(true)}
                        sx={{ backgroundColor: COLORS.ERROR[500], '&:hover': { backgroundColor: COLORS.ERROR[600] } }}
                    >
                        Tạo nhiệm vụ mới
                    </Button>
                </Stack>

                {/* Task List */}
                <TaskList
                    tasks={tasks}
                    services={services}
                    onDeleteTask={handleDeleteTask}
                    onEditTask={handleEditTask}
                    onViewTask={handleViewTask}
                />
            </Box>

            {/* Task Creation/Edit Wizard */}
            <TaskWizard
                open={wizardOpen}
                onClose={handleCloseWizard}
                onCreateTask={handleCreateTask}
                onUpdateTask={handleUpdateTask}
                editingTask={editingTask}
                services={services}
                areas={areas}
                staff={staff}
                petGroupNames={petGroupNames}
                petGroupsMap={petGroupsMap}
            />

            {/* Task Details */}
            <TaskDetailsDialog
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                task={detailsTask}
                services={services}
                areas={areas}
                staff={staff}
                petGroupsMap={petGroupsMap}
            />

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={confirmDeleteOpen}
                onClose={() => {
                    setConfirmDeleteOpen(false);
                    setTaskToDelete(null);
                }}
                onConfirm={confirmDeleteTask}
                title="Xóa nhiệm vụ"
                message={`Bạn có chắc chắn muốn xóa nhiệm vụ "${taskToDelete?.internalName || taskToDelete?.serviceName || ''}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
                type="error"
            />
        </Box>
    );
};

export default TasksPage;
