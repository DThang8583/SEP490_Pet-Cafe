import axios from 'axios';

// Base configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = (prefix = 'id') => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Auth helper
const getCurrentUser = () => {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
};

// Permission check
const checkPermission = (user, permission) => {
    if (!user) return false;

    const rolePermissions = {
        'customer': ['pet_management', 'pet_view_own'],
        'working_staff': ['pet_view_assigned'],
        'manager': ['pet_management', 'pet_view_all'],
        'admin': ['full_access']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission) || userPermissions.includes('full_access');
};

// Mock pets database
let MOCK_PETS = [
    {
        id: 'pet-001',
        ownerId: 'user-007',
        name: 'Bông',
        species: 'dog',
        breed: 'Golden Retriever',
        age: 3,
        weight: 25.5,
        gender: 'female',
        color: 'Vàng',
        avatar: 'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=300&auto=format&fit=crop',
        microchipId: 'MC001234567',
        vaccinations: [
            {
                name: 'Dại',
                date: '2023-01-15',
                nextDue: '2024-01-15',
                veterinarian: 'Dr. Nguyễn Văn A'
            },
            {
                name: 'Viêm gan',
                date: '2023-06-20',
                nextDue: '2024-06-20',
                veterinarian: 'Dr. Trần Thị B'
            }
        ],
        medicalHistory: [
            {
                date: '2023-12-10',
                condition: 'Khám định kỳ',
                treatment: 'Khỏe mạnh',
                veterinarian: 'Dr. Nguyễn Văn A',
                notes: 'Sức khỏe tốt, cần tiếp tục chế độ ăn hiện tại'
            }
        ],
        preferences: {
            favoriteToys: ['Bóng tennis', 'Dây kéo'],
            favoriteFood: 'Royal Canin Adult',
            allergies: [],
            specialNeeds: 'Cần vận động nhiều'
        },
        behavior: {
            temperament: 'friendly',
            energyLevel: 'high',
            trainingLevel: 'basic',
            socializedWithDogs: true,
            socializedWithCats: false,
            goodWithChildren: true
        },
        services: ['grooming', 'training'],
        notes: 'Rất thân thiện và năng động',
        createdAt: '2023-01-10T10:00:00',
        updatedAt: '2023-12-10T15:30:00'
    },
    {
        id: 'pet-002',
        ownerId: 'user-007',
        name: 'Miu',
        species: 'cat',
        breed: 'Mèo Anh lông ngắn',
        age: 2,
        weight: 4.2,
        gender: 'female',
        color: 'Xám',
        avatar: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?q=80&w=300&auto=format&fit=crop',
        microchipId: 'MC001234568',
        vaccinations: [
            {
                name: 'Dại',
                date: '2023-03-10',
                nextDue: '2024-03-10',
                veterinarian: 'Dr. Lê Văn C'
            }
        ],
        medicalHistory: [
            {
                date: '2023-11-15',
                condition: 'Cảm lạnh nhẹ',
                treatment: 'Thuốc kháng sinh',
                veterinarian: 'Dr. Lê Văn C',
                notes: 'Đã khỏi hoàn toàn'
            }
        ],
        preferences: {
            favoriteToys: ['Chuột nhồi bông', 'Banh nhỏ'],
            favoriteFood: 'Whiskas Adult',
            allergies: ['Cá ngừ'],
            specialNeeds: 'Cần môi trường yên tĩnh'
        },
        behavior: {
            temperament: 'calm',
            energyLevel: 'medium',
            trainingLevel: 'none',
            socializedWithDogs: false,
            socializedWithCats: true,
            goodWithChildren: true
        },
        services: ['grooming', 'healthcare'],
        notes: 'Tính tình hiền lành, dễ thương',
        createdAt: '2023-02-15T14:20:00',
        updatedAt: '2023-11-15T09:45:00'
    },
    {
        id: 'pet-003',
        ownerId: 'user-008',
        name: 'Max',
        species: 'dog',
        breed: 'Husky',
        age: 4,
        weight: 30.0,
        gender: 'male',
        color: 'Đen trắng',
        avatar: 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?q=80&w=300&auto=format&fit=crop',
        microchipId: 'MC001234569',
        vaccinations: [
            {
                name: 'Dại',
                date: '2023-02-20',
                nextDue: '2024-02-20',
                veterinarian: 'Dr. Phạm Thị D'
            }
        ],
        medicalHistory: [],
        preferences: {
            favoriteToys: ['Frisbee', 'Xương cao su'],
            favoriteFood: 'Pedigree Adult',
            allergies: ['Gà'],
            specialNeeds: 'Cần luyện tập thường xuyên'
        },
        behavior: {
            temperament: 'energetic',
            energyLevel: 'very_high',
            trainingLevel: 'intermediate',
            socializedWithDogs: true,
            socializedWithCats: false,
            goodWithChildren: true
        },
        services: ['training', 'healthcare'],
        notes: 'Thông minh, cần luyện tập thường xuyên',
        createdAt: '2023-01-05T16:30:00',
        updatedAt: '2023-12-01T11:20:00'
    }
];

// Pet breeds by species
const PET_BREEDS = {
    dog: [
        'Golden Retriever', 'Labrador', 'Husky', 'Poodle', 'Bulldog',
        'German Shepherd', 'Shiba Inu', 'Corgi', 'Chihuahua', 'Pug',
        'Border Collie', 'Rottweiler', 'Beagle', 'Dachshund', 'Boxer'
    ],
    cat: [
        'Mèo Anh lông ngắn', 'Mèo Anh lông dài', 'Mèo Nga', 'Persian',
        'Maine Coon', 'Siamese', 'Ragdoll', 'Bengal', 'Scottish Fold',
        'Munchkin', 'Sphynx', 'Abyssinian', 'Mèo ta', 'Exotic Shorthair'
    ],
    bird: [
        'Vẹt', 'Chim cảnh', 'Yến', 'Chào mào', 'Họa mi',
        'Cảnh cửu', 'Chim sẻ', 'Chim ri', 'Chim khướu'
    ],
    rabbit: [
        'Thỏ Hà Lan', 'Thỏ Angora', 'Thỏ tai cụp', 'Thỏ Mini Lop',
        'Thỏ Rex', 'Thỏ Lion Head'
    ]
};

// Pet APIs
const petApi = {
    // Get customer's pets
    async getMyPets() {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_view_own')) {
            throw new Error('Không có quyền xem thú cưng');
        }

        const pets = MOCK_PETS.filter(pet => pet.ownerId === currentUser.id);

        // Sort by creation date (newest first)
        pets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return { success: true, data: pets };
    },

    // Get pet by ID
    async getPetById(petId) {
        await delay(200);
        const currentUser = getCurrentUser();

        const pet = MOCK_PETS.find(p =>
            p.id === petId &&
            (p.ownerId === currentUser.id || checkPermission(currentUser, 'pet_view_all'))
        );

        if (!pet) {
            throw new Error('Không tìm thấy thú cưng hoặc không có quyền truy cập');
        }

        return { success: true, data: pet };
    },

    // Add new pet
    async addPet(petData) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_management')) {
            throw new Error('Không có quyền thêm thú cưng');
        }

        // Validate required fields
        if (!petData.name || !petData.name.trim()) {
            throw new Error('Tên thú cưng là bắt buộc');
        }

        if (!petData.species) {
            throw new Error('Loài thú cưng là bắt buộc');
        }

        if (!petData.breed) {
            throw new Error('Giống thú cưng là bắt buộc');
        }

        if (!petData.age || petData.age < 0) {
            throw new Error('Tuổi thú cưng không hợp lệ');
        }

        if (!petData.gender || !['male', 'female'].includes(petData.gender)) {
            throw new Error('Giới tính thú cưng không hợp lệ');
        }

        // Check if pet name already exists for this owner
        const existingPet = MOCK_PETS.find(pet =>
            pet.ownerId === currentUser.id &&
            pet.name.toLowerCase() === petData.name.toLowerCase().trim()
        );

        if (existingPet) {
            throw new Error('Bạn đã có thú cưng với tên này rồi');
        }

        const newPet = {
            id: generateId('pet'),
            ownerId: currentUser.id,
            name: petData.name.trim(),
            species: petData.species,
            breed: petData.breed,
            age: parseInt(petData.age),
            weight: parseFloat(petData.weight) || 0,
            gender: petData.gender,
            color: petData.color || '',
            avatar: petData.avatar || `https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=300&auto=format&fit=crop`,
            microchipId: petData.microchipId || '',
            vaccinations: petData.vaccinations || [],
            medicalHistory: petData.medicalHistory || [],
            preferences: {
                favoriteToys: petData.preferences?.favoriteToys || [],
                favoriteFood: petData.preferences?.favoriteFood || '',
                allergies: petData.preferences?.allergies || [],
                specialNeeds: petData.preferences?.specialNeeds || ''
            },
            behavior: {
                temperament: petData.behavior?.temperament || 'friendly',
                energyLevel: petData.behavior?.energyLevel || 'medium',
                trainingLevel: petData.behavior?.trainingLevel || 'none',
                socializedWithDogs: petData.behavior?.socializedWithDogs || false,
                socializedWithCats: petData.behavior?.socializedWithCats || false,
                goodWithChildren: petData.behavior?.goodWithChildren || true
            },
            services: petData.services || [],
            notes: petData.notes || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        MOCK_PETS.push(newPet);

        return { success: true, data: newPet, message: 'Thêm thú cưng thành công' };
    },

    // Update pet information
    async updatePet(petId, updates) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_management')) {
            throw new Error('Không có quyền cập nhật thú cưng');
        }

        const petIndex = MOCK_PETS.findIndex(p =>
            p.id === petId && p.ownerId === currentUser.id
        );

        if (petIndex === -1) {
            throw new Error('Không tìm thấy thú cưng hoặc không có quyền cập nhật');
        }

        // Validate updates
        if (updates.name && !updates.name.trim()) {
            throw new Error('Tên thú cưng không được để trống');
        }

        if (updates.age && updates.age < 0) {
            throw new Error('Tuổi thú cưng không hợp lệ');
        }

        if (updates.weight && updates.weight < 0) {
            throw new Error('Cân nặng thú cưng không hợp lệ');
        }

        // Check for duplicate name if name is being updated
        if (updates.name && updates.name.toLowerCase().trim() !== MOCK_PETS[petIndex].name.toLowerCase()) {
            const existingPet = MOCK_PETS.find(pet =>
                pet.ownerId === currentUser.id &&
                pet.id !== petId &&
                pet.name.toLowerCase() === updates.name.toLowerCase().trim()
            );

            if (existingPet) {
                throw new Error('Bạn đã có thú cưng với tên này rồi');
            }
        }

        // Apply updates
        const allowedFields = [
            'name', 'breed', 'age', 'weight', 'color', 'avatar', 'microchipId',
            'vaccinations', 'medicalHistory', 'preferences', 'behavior',
            'services', 'notes'
        ];

        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                if (field === 'name') {
                    MOCK_PETS[petIndex][field] = updates[field].trim();
                } else if (field === 'age' || field === 'weight') {
                    MOCK_PETS[petIndex][field] = parseFloat(updates[field]);
                } else {
                    MOCK_PETS[petIndex][field] = updates[field];
                }
            }
        });

        MOCK_PETS[petIndex].updatedAt = new Date().toISOString();

        return {
            success: true,
            data: MOCK_PETS[petIndex],
            message: 'Cập nhật thông tin thú cưng thành công'
        };
    },

    // Delete pet
    async deletePet(petId) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_management')) {
            throw new Error('Không có quyền xóa thú cưng');
        }

        const petIndex = MOCK_PETS.findIndex(p =>
            p.id === petId && p.ownerId === currentUser.id
        );

        if (petIndex === -1) {
            throw new Error('Không tìm thấy thú cưng hoặc không có quyền xóa');
        }

        // Check if pet has active bookings
        // This would be imported from bookingApi in real implementation
        const hasActiveBookings = false; // Placeholder

        if (hasActiveBookings) {
            throw new Error('Không thể xóa thú cưng có lịch hẹn đang hoạt động');
        }

        const deletedPet = MOCK_PETS[petIndex];
        MOCK_PETS.splice(petIndex, 1);

        return {
            success: true,
            data: deletedPet,
            message: 'Xóa thú cưng thành công'
        };
    },

    // Get pet breeds by species
    async getPetBreeds(species = null) {
        await delay(100);

        if (species) {
            const breeds = PET_BREEDS[species] || [];
            return { success: true, data: breeds };
        }

        return { success: true, data: PET_BREEDS };
    },

    // Add vaccination record
    async addVaccination(petId, vaccinationData) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_management')) {
            throw new Error('Không có quyền cập nhật thông tin thú cưng');
        }

        const petIndex = MOCK_PETS.findIndex(p =>
            p.id === petId && p.ownerId === currentUser.id
        );

        if (petIndex === -1) {
            throw new Error('Không tìm thấy thú cưng');
        }

        const newVaccination = {
            id: generateId('vacc'),
            name: vaccinationData.name,
            date: vaccinationData.date,
            nextDue: vaccinationData.nextDue,
            veterinarian: vaccinationData.veterinarian || '',
            notes: vaccinationData.notes || '',
            addedAt: new Date().toISOString()
        };

        if (!MOCK_PETS[petIndex].vaccinations) {
            MOCK_PETS[petIndex].vaccinations = [];
        }

        MOCK_PETS[petIndex].vaccinations.push(newVaccination);
        MOCK_PETS[petIndex].updatedAt = new Date().toISOString();

        return {
            success: true,
            data: newVaccination,
            message: 'Thêm thông tin tiêm phòng thành công'
        };
    },

    // Add medical history record
    async addMedicalRecord(petId, medicalData) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_management')) {
            throw new Error('Không có quyền cập nhật thông tin thú cưng');
        }

        const petIndex = MOCK_PETS.findIndex(p =>
            p.id === petId && p.ownerId === currentUser.id
        );

        if (petIndex === -1) {
            throw new Error('Không tìm thấy thú cưng');
        }

        const newRecord = {
            id: generateId('med'),
            date: medicalData.date,
            condition: medicalData.condition,
            treatment: medicalData.treatment || '',
            veterinarian: medicalData.veterinarian || '',
            notes: medicalData.notes || '',
            addedAt: new Date().toISOString()
        };

        if (!MOCK_PETS[petIndex].medicalHistory) {
            MOCK_PETS[petIndex].medicalHistory = [];
        }

        MOCK_PETS[petIndex].medicalHistory.push(newRecord);
        MOCK_PETS[petIndex].updatedAt = new Date().toISOString();

        return {
            success: true,
            data: newRecord,
            message: 'Thêm hồ sơ y tế thành công'
        };
    },

    // Get pet statistics for owner
    async getPetStats(petId) {
        await delay(200);
        const currentUser = getCurrentUser();

        const pet = MOCK_PETS.find(p =>
            p.id === petId && p.ownerId === currentUser.id
        );

        if (!pet) {
            throw new Error('Không tìm thấy thú cưng');
        }

        // This would integrate with booking and feedback APIs in real implementation
        const stats = {
            totalBookings: 5, // Placeholder
            completedServices: 4,
            upcomingBookings: 1,
            totalSpent: 850000,
            averageServiceRating: 4.8,
            lastVisit: '2024-01-27T10:30:00',
            nextAppointment: '2024-02-05T14:00:00',
            favoriteServices: ['grooming', 'healthcare'],
            healthStatus: 'excellent',
            vaccinationStatus: 'up_to_date'
        };

        return { success: true, data: stats };
    },

    // Upload pet photo
    async uploadPetPhoto(petId, photoFile) {
        await delay(800);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_management')) {
            throw new Error('Không có quyền cập nhật ảnh thú cưng');
        }

        const petIndex = MOCK_PETS.findIndex(p =>
            p.id === petId && p.ownerId === currentUser.id
        );

        if (petIndex === -1) {
            throw new Error('Không tìm thấy thú cưng');
        }

        // Validate file
        if (!photoFile) {
            throw new Error('Không có file ảnh được chọn');
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(photoFile.type)) {
            throw new Error('Chỉ chấp nhận file ảnh định dạng JPG, PNG, WEBP');
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (photoFile.size > maxSize) {
            throw new Error('File ảnh không được vượt quá 5MB');
        }

        // Simulate upload process
        const mockUploadUrl = URL.createObjectURL(photoFile);

        MOCK_PETS[petIndex].avatar = mockUploadUrl;
        MOCK_PETS[petIndex].updatedAt = new Date().toISOString();

        return {
            success: true,
            data: {
                petId,
                avatar: mockUploadUrl
            },
            message: 'Cập nhật ảnh thú cưng thành công'
        };
    }
};

// Export both named and default
export { petApi };
export default petApi;
