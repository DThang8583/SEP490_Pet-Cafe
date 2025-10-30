// ========== MOCK DATA FOR ENTIRE SYSTEM ==========

// Import and re-export MOCK_SERVICES from mockServices.js
import { MOCK_SERVICES } from './mockServices';
export { MOCK_SERVICES };

// Work Types (from official API)
export const MOCK_WORK_TYPES = [
    {
        id: 'b0c8a471-3b55-4038-9642-b598c072ea45',
        name: 'Quản lý Khu Vực Chó',
        description: 'Chịu trách nhiệm giám sát, huấn luyện cơ bản, cho ăn và đảm bảo vệ sinh, an toàn trong khu vực sinh hoạt của chó. Quản lý tương tác giữa chó và khách hàng, đặc biệt là các giống chó lớn.',
        is_active: true,
        tasks: [],
        area_work_types: [],
        team_work_types: [],
        created_at: '2025-10-27T12:28:16.424682+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T12:28:16.424683+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '7e7477a6-f481-4df6-b3fd-626944475fb5',
        name: 'Quản lý Khu Vực Mèo',
        description: 'Chịu trách nhiệm quản lý, giám sát sức khỏe, cho ăn, dọn dẹp vệ sinh khu vực sinh hoạt của mèo, và đảm bảo tương tác an toàn giữa mèo với khách hàng trong khu vực Cat Zone.',
        is_active: true,
        tasks: [],
        area_work_types: [],
        team_work_types: [],
        created_at: '2025-10-27T12:31:09.910051+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T12:31:09.910051+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '057b182b-94e1-477e-8362-e89df03c2faf',
        name: 'Thực phẩm & Đồ uống',
        description: 'Phụ trách toàn bộ khu vực quầy bar và bàn khách, bao gồm pha chế, phục vụ đồ uống và thức ăn cho người, và duy trì vệ sinh, kiểm soát nguyên liệu tại khu vực F&B.',
        is_active: true,
        tasks: [],
        area_work_types: [],
        team_work_types: [],
        created_at: '2025-10-27T12:31:22.371814+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T12:31:22.371814+00:00',
        updated_by: null,
        is_deleted: false
    }
];

// Work Shifts (Ca làm việc)
export const MOCK_WORK_SHIFTS = [
    {
        id: 'aa5153ab-b361-40ac-bdfe-119191cdad89',
        name: 'Ca Sáng (Morning Shift)',
        start_time: '07:30:00',
        end_time: '12:00:00',
        description: 'Chuẩn bị đồ uống, vệ sinh khu vực thú cưng và quầy bar, mở cửa đón khách và phục vụ đồ ăn sáng nhẹ.',
        is_active: true,
        applicable_days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        team_work_shifts: [],
        daily_schedules: [],
        created_at: '2025-10-27T13:30:56.843057+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T13:30:56.843057+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'cd24631d-084b-4db8-b1a4-5b48dbac3b21',
        name: 'Ca Chiều Cao Điểm (Peak Afternoon)',
        start_time: '12:00:00',
        end_time: '17:00:00',
        description: 'Phục vụ và xử lý đơn hàng trong giờ cao điểm, quản lý tương tác của khách hàng với thú cưng và hỗ trợ bán hàng sản phẩm.',
        is_active: true,
        applicable_days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
        team_work_shifts: [],
        daily_schedules: [],
        created_at: '2025-10-27T13:31:10.174468+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T13:31:10.174468+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'bb2310ba-58c6-4466-9e8a-371b2d2e6331',
        name: 'Ca Tối & Đóng Cửa (Closing)',
        start_time: '17:00:00',
        end_time: '21:30:00',
        description: 'Phục vụ khách hàng buổi tối, dọn dọn tổng thể quầy bar và khu vực chung, cho thú cưng ăn bữa cuối và khóa cửa quán.',
        is_active: true,
        applicable_days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
        team_work_shifts: [],
        daily_schedules: [],
        created_at: '2025-10-27T13:31:19.295117+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T13:31:19.295118+00:00',
        updated_by: null,
        is_deleted: false
    }
];

// Pet Species (Loài)
export const MOCK_PET_SPECIES = [
    {
        id: 'b6988687-c027-4b63-b91f-e8652c7a54c6',
        name: 'mèo',
        description: 'Loài động vật có vú, nổi tiếng với sự nhanh nhẹn, khả năng săn mồi và thường được nuôi làm thú cưng trong nhà.',
        is_active: true,
        pet_breeds: [],
        pets: [],
        vaccine_types: [],
        created_at: '2025-10-27T06:12:33.364689+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:12:33.364689+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '8d769794-167b-4458-a9a9-ac33748feee1',
        name: 'chó',
        description: 'Loài động vật có vú , được biết đến là \'người bạn tốt nhất của con người\' với lòng trung thành, khả năng học hỏi và đa dạng về giống loài.',
        is_active: true,
        pet_breeds: [],
        pets: [],
        vaccine_types: [],
        created_at: '2025-10-27T06:12:45.528755+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:12:45.528755+00:00',
        updated_by: null,
        is_deleted: false
    }
];

// Pet Breeds (Giống)
export const MOCK_PET_BREEDS = [
    // ===== GIỐNG MÈO =====
    {
        id: '9e017f29-0eec-439d-a305-1b3dedc6c1bc',
        name: 'Scottish Fold',
        species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6',
        description: 'Nổi tiếng với đôi tai cụp độc đáo và tính cách hiền lành, dễ gần, thích nghi tốt với cuộc sống gia đình.',
        average_weight: 4,
        average_lifespan: 15,
        species: null,
        pets: [],
        created_at: '2025-10-27T06:14:13.093502+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:14:13.093503+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'aa11bb22-cc33-dd44-ee55-ff6677889901',
        name: 'Persian',
        species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6',
        description: 'Mèo Ba Tư có bộ lông dài và mượt mà, khuôn mặt dẹt đặc trưng, tính tình hiền lành và thích được vuốt ve.',
        average_weight: 5,
        average_lifespan: 13,
        species: null,
        pets: [],
        created_at: '2025-10-27T06:18:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:18:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'bb22cc33-dd44-ee55-ff66-778899002211',
        name: 'British Shorthair',
        species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6',
        description: 'Mèo Anh lông ngắn, có thân hình chắc nịch, bộ lông dày, tính cách điềm tĩnh và độc lập.',
        average_weight: 5.5,
        average_lifespan: 14,
        species: null,
        pets: [],
        created_at: '2025-10-27T06:19:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:19:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'cc33dd44-ee55-ff66-7788-990033221100',
        name: 'Ragdoll',
        species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6',
        description: 'Mèo cỡ lớn với bộ lông mềm mại, mắt xanh dương đặc trưng, rất hiền lành và thích được bế.',
        average_weight: 6,
        average_lifespan: 15,
        species: null,
        pets: [],
        created_at: '2025-10-27T06:20:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:20:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'dd44ee55-ff66-7788-9900-114422330011',
        name: 'Maine Coon',
        species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6',
        description: 'Giống mèo lớn nhất, có bộ lông dài và dày, tai có lông tua, thân thiện và thông minh.',
        average_weight: 7,
        average_lifespan: 13,
        species: null,
        pets: [],
        created_at: '2025-10-27T06:21:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:21:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'ee55ff66-7788-9900-1122-aabb44332211',
        name: 'Siamese',
        species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6',
        description: 'Mèo Xiêm có bộ lông ngắn, tai và mõm nhọn, mắt xanh lam, rất thông minh và năng động.',
        average_weight: 3.5,
        average_lifespan: 15,
        species: null,
        pets: [],
        created_at: '2025-10-27T06:22:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:22:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },

    // ===== GIỐNG CHÓ =====
    {
        id: 'e717072a-f0ff-489f-a9d5-257fc3db9c9c',
        name: 'Poodle Toy',
        species_id: '8d769794-167b-4458-a9a9-ac33748feee1',
        description: 'Giống chó nhỏ, thông minh, hiếu động, có bộ lông xoăn không rụng và cần được chải chuốt thường xuyên.',
        average_weight: 3.5,
        average_lifespan: 14,
        species: null,
        pets: [],
        created_at: '2025-10-27T06:17:07.357146+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:17:07.357146+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'ff667788-9900-1122-aabb-ccddeeff5544',
        name: 'Golden Retriever',
        species_id: '8d769794-167b-4458-a9a9-ac33748feee1',
        description: 'Chó săn lông vàng cỡ lớn, thân thiện, thông minh, rất trung thành và phù hợp cho gia đình.',
        average_weight: 32,
        average_lifespan: 12,
        species: null,
        pets: [],
        created_at: '2025-10-27T06:23:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:23:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '11223344-5566-7788-99aa-bbccddee6655',
        name: 'Labrador Retriever',
        species_id: '8d769794-167b-4458-a9a9-ac33748feee1',
        description: 'Chó săn cỡ lớn, hiền lành, năng động, thích bơi lội và rất thông minh, dễ huấn luyện.',
        average_weight: 30,
        average_lifespan: 12,
        species: null,
        pets: [],
        created_at: '2025-10-27T06:24:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:24:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '22334455-6677-8899-aabb-ccddeeff7766',
        name: 'Chihuahua',
        species_id: '8d769794-167b-4458-a9a9-ac33748feee1',
        description: 'Giống chó nhỏ nhất thế giới, cá tính mạnh, trung thành với chủ và phù hợp với cuộc sống căn hộ.',
        average_weight: 2,
        average_lifespan: 16,
        species: null,
        pets: [],
        created_at: '2025-10-27T06:25:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:25:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '33445566-7788-99aa-bbcc-ddeeff008877',
        name: 'Shiba Inu',
        species_id: '8d769794-167b-4458-a9a9-ac33748feee1',
        description: 'Chó Nhật Bản cỡ nhỏ-trung bình, bộ lông dày, tính cách độc lập, thông minh và trung thành.',
        average_weight: 10,
        average_lifespan: 14,
        species: null,
        pets: [],
        created_at: '2025-10-27T06:26:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:26:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '44556677-8899-aabb-ccdd-eeff11229988',
        name: 'Corgi',
        species_id: '8d769794-167b-4458-a9a9-ac33748feee1',
        description: 'Chó chăn cừu cỡ nhỏ với chân ngắn, tai dài, tính cách vui vẻ và năng động.',
        average_weight: 12,
        average_lifespan: 13,
        species: null,
        pets: [],
        created_at: '2025-10-27T06:27:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:27:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    }
];

// Helper function to create nested species data
const createNestedSpeciesData = (speciesId) => {
    const species = MOCK_PET_SPECIES.find(s => s.id === speciesId);
    if (!species) return null;
    return {
        ...species,
        pet_breeds: [],
        pets: [],
        vaccine_types: []
    };
};

// Helper function to create nested breed data
const createNestedBreedData = (breedId) => {
    const breed = MOCK_PET_BREEDS.find(b => b.id === breedId);
    if (!breed) return null;
    return {
        ...breed,
        species: null,
        pets: []
    };
};

// Pet Groups (Nhóm Pet)
export const MOCK_PET_GROUPS = [
    // ===== NHÓM MÈO =====
    {
        id: 'ca287dab-96a8-4922-86d5-1c2a99cc34ed',
        name: 'Mèo Cục Cưng Lông Dài',
        description: 'Nhóm các giống mèo có bộ lông dài (Scottish Fold, Persian, Maine Coon, Ragdoll) cần chải lông hàng ngày và chế độ ăn hỗ trợ tiêu búi lông.',
        pet_species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6',
        pet_species: createNestedSpeciesData('b6988687-c027-4b63-b91f-e8652c7a54c6'),
        pet_breed_id: null, // Accept all breeds of cats
        pet_breed: null,
        pets: [],
        slots: [],
        created_at: '2025-10-27T06:31:04.595906+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:31:04.595906+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'db398ebc-a7b9-5a33-97e6-2d3ba0dd45fe',
        name: 'Mèo Lông Ngắn Năng Động',
        description: 'Nhóm các giống mèo có bộ lông ngắn, dễ chăm sóc, năng động và thích vui chơi như British Shorthair, Siamese.',
        pet_species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6',
        pet_species: createNestedSpeciesData('b6988687-c027-4b63-b91f-e8652c7a54c6'),
        pet_breed_id: 'bb22cc33-dd44-ee55-ff66-778899002211', // British Shorthair
        pet_breed: createNestedBreedData('bb22cc33-dd44-ee55-ff66-778899002211'),
        pets: [],
        slots: [],
        created_at: '2025-10-27T06:31:10.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:31:10.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '55667788-99aa-bbcc-ddee-ff0011223344',
        name: 'Mèo Ba Tư Quý Tộc',
        description: 'Nhóm các giống mèo Ba Tư và các giống mèo mặt dẹt, đặc trưng bộ lông dài mượt mà và tính cách hiền lành, cần chăm sóc đặc biệt.',
        pet_species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6',
        pet_species: createNestedSpeciesData('b6988687-c027-4b63-b91f-e8652c7a54c6'),
        pet_breed_id: 'aa11bb22-cc33-dd44-ee55-ff6677889901', // Persian
        pet_breed: createNestedBreedData('aa11bb22-cc33-dd44-ee55-ff6677889901'),
        pets: [],
        slots: [],
        created_at: '2025-10-27T06:32:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:32:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },

    // ===== NHÓM CHÓ =====
    {
        id: '7f0ede0f-a11a-47d2-a075-bc8500a4e321',
        name: 'Chó Nhỏ Năng Động',
        description: 'Bao gồm các giống chó nhỏ (dưới 10kg) nhưng có mức năng lượng cao như Poodle Toy, Chihuahua, phù hợp với các gia đình thường xuyên vận động hoặc ở căn hộ.',
        pet_species_id: '8d769794-167b-4458-a9a9-ac33748feee1',
        pet_species: createNestedSpeciesData('8d769794-167b-4458-a9a9-ac33748feee1'),
        pet_breed_id: null, // Accept multiple small breeds
        pet_breed: null,
        pets: [],
        slots: [],
        created_at: '2025-10-27T06:33:19.495131+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:33:19.495131+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '66778899-aabb-ccdd-eeff-001122334455',
        name: 'Chó Săn Cỡ Lớn Thân Thiện',
        description: 'Nhóm các giống chó săn cỡ lớn như Golden Retriever, Labrador, có tính cách hiền lành, thân thiện và phù hợp cho gia đình có trẻ em.',
        pet_species_id: '8d769794-167b-4458-a9a9-ac33748feee1',
        pet_species: createNestedSpeciesData('8d769794-167b-4458-a9a9-ac33748feee1'),
        pet_breed_id: 'ff667788-9900-1122-aabb-ccddeeff5544', // Golden Retriever
        pet_breed: createNestedBreedData('ff667788-9900-1122-aabb-ccddeeff5544'),
        pets: [],
        slots: [],
        created_at: '2025-10-27T06:34:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:34:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '77889900-aabb-ccdd-eeff-112233445566',
        name: 'Chó Nhật Bản Đặc Biệt',
        description: 'Nhóm dành cho các giống chó Nhật Bản như Shiba Inu, Akita, với tính cách độc lập, thông minh và trung thành.',
        pet_species_id: '8d769794-167b-4458-a9a9-ac33748feee1',
        pet_species: createNestedSpeciesData('8d769794-167b-4458-a9a9-ac33748feee1'),
        pet_breed_id: '33445566-7788-99aa-bbcc-ddeeff008877', // Shiba Inu
        pet_breed: createNestedBreedData('33445566-7788-99aa-bbcc-ddeeff008877'),
        pets: [],
        slots: [],
        created_at: '2025-10-27T06:35:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:35:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '88990011-bbcc-ddee-ff00-223344556677',
        name: 'Chó Chăn Cừu Hoạt Bát',
        description: 'Nhóm các giống chó chăn cừu như Corgi, Border Collie, rất thông minh, năng động và cần hoạt động thể chất thường xuyên.',
        pet_species_id: '8d769794-167b-4458-a9a9-ac33748feee1',
        pet_species: createNestedSpeciesData('8d769794-167b-4458-a9a9-ac33748feee1'),
        pet_breed_id: '44556677-8899-aabb-ccdd-eeff11229988', // Corgi
        pet_breed: createNestedBreedData('44556677-8899-aabb-ccdd-eeff11229988'),
        pets: [],
        slots: [],
        created_at: '2025-10-27T06:36:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:36:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    }
];

// Areas
export const MOCK_AREAS = [
    {
        id: '1c92f639-a6fa-48c3-b4b7-0a713389df5c',
        name: 'Dog Zone - Khu Vực Sân Chơi',
        description: 'Khu vực rộng rãi có hàng rào, dành riêng cho chó có kích thước vừa và lớn vui chơi. Có các trò chơi huấn luyện cơ bản và bể nước nhỏ.',
        location: 'Tầng trệt, phía sau quầy bar',
        max_capacity: 20,
        is_active: true,
        image_url: 'https://firebasestorage.googleapis.com/v0/b/digital-dynamo-cb555.appspot.com/o/assets%2Fimages%2F4c131330-db62-44db-8099-df710340edf7.webp?alt=media&token=2237c04a-c0d2-40b6-a23e-bf19e7153a06',
        slots: [],
        area_work_types: [
            {
                area_id: '1c92f639-a6fa-48c3-b4b7-0a713389df5c',
                work_type_id: 'b0c8a471-3b55-4038-9642-b598c072ea45',
                description: null,
                area: null,
                work_type: {
                    name: 'Dog Zone Management ',
                    description: 'Chịu trách nhiệm giám sát, huấn luyện cơ bản, cho ăn và đảm bảo vệ sinh, an toàn trong khu vực sinh hoạt của chó. Quản lý tương tác giữa chó và khách hàng, đặc biệt là các giống chó lớn.',
                    is_active: true,
                    tasks: [],
                    area_work_types: [null],
                    team_work_types: [],
                    id: 'b0c8a471-3b55-4038-9642-b598c072ea45',
                    created_at: '2025-10-27T12:28:16.424682+00:00',
                    created_by: '00000000-0000-0000-0000-000000000000',
                    updated_at: '2025-10-27T12:28:16.424683+00:00',
                    updated_by: null,
                    is_deleted: false
                },
                id: '2d0dc8d5-9406-4956-a99a-79d453034836',
                created_at: '2025-10-27T12:36:23.605599+00:00',
                created_by: '00000000-0000-0000-0000-000000000000',
                updated_at: '2025-10-27T12:36:23.6056+00:00',
                updated_by: null,
                is_deleted: false
            }
        ],
        created_at: '2025-10-27T12:36:23.6056+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T12:36:23.605601+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '0a10e6b3-085d-42f2-b218-8474302d72b4',
        name: 'Cat Lounge - Tầng Lửng',
        description: 'Khu vực tầng lửng yên tĩnh, được trang bị tháp mèo, đồ chơi và ghế sofa ấm cúng. Nơi mèo nghỉ ngơi và tương tác nhẹ nhàng với khách hàng.',
        location: 'Tầng lửng, phía trên khu F&B',
        max_capacity: 25,
        is_active: true,
        image_url: 'https://firebasestorage.googleapis.com/v0/b/digital-dynamo-cb555.appspot.com/o/assets%2Fimages%2F4c131330-db62-44db-8099-df710340edf7.webp?alt=media&token=2237c04a-c0d2-40b6-a23e-bf19e7153a06',
        slots: [],
        area_work_types: [
            {
                area_id: '0a10e6b3-085d-42f2-b218-8474302d72b4',
                work_type_id: '7e7477a6-f481-4df6-b3fd-626944475fb5',
                description: null,
                area: null,
                work_type: {
                    name: 'Cat Zone Management ',
                    description: 'Chịu trách nhiệm quản lý, giám sát sức khỏe, cho ăn, dọn dẹp vệ sinh khu vực sinh hoạt của mèo, và đảm bảo tương tác an toàn giữa mèo với khách hàng trong khu vực Cat Zone.',
                    is_active: true,
                    tasks: [],
                    area_work_types: [null],
                    team_work_types: [],
                    id: '7e7477a6-f481-4df6-b3fd-626944475fb5',
                    created_at: '2025-10-27T12:31:09.910051+00:00',
                    created_by: '00000000-0000-0000-0000-000000000000',
                    updated_at: '2025-10-27T12:31:09.910051+00:00',
                    updated_by: null,
                    is_deleted: false
                },
                id: 'bc0bbba1-6705-40f8-a5db-e38267b095f9',
                created_at: '2025-10-27T12:37:34.296162+00:00',
                created_by: '00000000-0000-0000-0000-000000000000',
                updated_at: '2025-10-27T12:37:34.296163+00:00',
                updated_by: null,
                is_deleted: false
            }
        ],
        created_at: '2025-10-27T12:37:34.296163+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T12:37:34.296163+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '7f14ba38-0c9d-48f4-9fbb-c6d93df5eda6',
        name: 'Khu Vực Quầy Bar & Phục Vụ',
        description: 'Bao gồm quầy pha chế (chỉ dành cho nhân viên) và khu vực ghế cao nơi khách hàng có thể ngồi, đặt hàng và quan sát quá trình pha chế. Thú cưng không được phép vào khu vực quầy.',
        location: 'Tầng trệt, đối diện lối vào',
        max_capacity: 8,
        is_active: true,
        image_url: 'https://firebasestorage.googleapis.com/v0/b/digital-dynamo-cb555.appspot.com/o/assets%2Fimages%2F4ee363ab-5f00-4c7e-a4df-73ea338ae077.jpg?alt=media&token=5dad83d9-7b70-4f25-8e75-65e4eaa4a6f3',
        slots: [],
        area_work_types: [
            {
                area_id: '7f14ba38-0c9d-48f4-9fbb-c6d93df5eda6',
                work_type_id: '057b182b-94e1-477e-8362-e89df03c2faf',
                description: null,
                area: null,
                work_type: {
                    name: 'Food & Beverage ',
                    description: 'Phụ trách toàn bộ khu vực quầy bar và bàn khách, bao gồm pha chế, phục vụ đồ uống và thức ăn cho người, và duy trì vệ sinh, kiểm soát nguyên liệu tại khu vực F&B.',
                    is_active: true,
                    tasks: [],
                    area_work_types: [null],
                    team_work_types: [],
                    id: '057b182b-94e1-477e-8362-e89df03c2faf',
                    created_at: '2025-10-27T12:31:22.371814+00:00',
                    created_by: '00000000-0000-0000-0000-000000000000',
                    updated_at: '2025-10-27T12:31:22.371814+00:00',
                    updated_by: null,
                    is_deleted: false
                },
                id: '7af37a9c-a568-4952-9bb0-64b8391c3c16',
                created_at: '2025-10-27T12:45:00.00487+00:00',
                created_by: '00000000-0000-0000-0000-000000000000',
                updated_at: '2025-10-27T12:45:00.004871+00:00',
                updated_by: null,
                is_deleted: false
            }
        ],
        created_at: '2025-10-27T12:45:00.004872+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T12:45:00.004872+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '9e8f7d6c-5b4a-3210-9876-543210abcdef',
        name: 'Phòng Grooming Chuyên Nghiệp',
        description: 'Phòng chăm sóc vệ sinh và làm đẹp cho thú cưng với đầy đủ thiết bị chuyên nghiệp: bồn tắm, máy sấy, bàn cắt tỉa lông, và các sản phẩm chăm sóc cao cấp.',
        location: 'Tầng 1, góc phải, gần cửa sau',
        max_capacity: 3,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800',
        slots: [],
        area_work_types: [
            {
                area_id: '9e8f7d6c-5b4a-3210-9876-543210abcdef',
                work_type_id: '7e7477a6-f481-4df6-b3fd-626944475fb5',
                description: null,
                area: null,
                work_type: {
                    name: 'Cat Zone Management ',
                    description: 'Chịu trách nhiệm quản lý, giám sát sức khỏe, cho ăn, dọn dẹp vệ sinh khu vực sinh hoạt của mèo, và đảm bảo tương tác an toàn giữa mèo với khách hàng trong khu vực Cat Zone.',
                    is_active: true,
                    tasks: [],
                    area_work_types: [],
                    team_work_types: [],
                    id: '7e7477a6-f481-4df6-b3fd-626944475fb5',
                    created_at: '2025-10-27T12:31:09.910051+00:00',
                    created_by: '00000000-0000-0000-0000-000000000000',
                    updated_at: '2025-10-27T12:31:09.910051+00:00',
                    updated_by: null,
                    is_deleted: false
                },
                id: 'grooming-wt-1',
                created_at: '2025-10-26T10:00:00.000000+00:00',
                created_by: '00000000-0000-0000-0000-000000000000',
                updated_at: '2025-10-26T10:00:00.000000+00:00',
                updated_by: null,
                is_deleted: false
            },
            {
                area_id: '9e8f7d6c-5b4a-3210-9876-543210abcdef',
                work_type_id: 'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f',
                description: null,
                area: null,
                work_type: {
                    name: 'Dog Zone Management',
                    description: 'Chịu trách nhiệm quản lý, giám sát sức khỏe, cho ăn, dọn dẹp vệ sinh khu vực sinh hoạt của chó, và đảm bảo tương tác an toàn giữa chó với khách hàng trong khu vực Dog Zone.',
                    is_active: true,
                    tasks: [],
                    area_work_types: [],
                    team_work_types: [],
                    id: 'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f',
                    created_at: '2025-10-27T12:31:15.784363+00:00',
                    created_by: '00000000-0000-0000-0000-000000000000',
                    updated_at: '2025-10-27T12:31:15.784363+00:00',
                    updated_by: null,
                    is_deleted: false
                },
                id: 'grooming-wt-2',
                created_at: '2025-10-26T10:00:00.000000+00:00',
                created_by: '00000000-0000-0000-0000-000000000000',
                updated_at: '2025-10-26T10:00:00.000000+00:00',
                updated_by: null,
                is_deleted: false
            }
        ],
        created_at: '2025-10-26T10:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-26T10:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '8d7c6b5a-4321-0fed-cba9-876543210abc',
        name: 'Khu Vực VIP - Phòng Riêng',
        description: 'Không gian riêng tư cao cấp dành cho khách hàng muốn có trải nghiệm đặc biệt. Được trang bị ghế sofa sang trọng, điều hòa, và không gian yên tĩnh.',
        location: 'Tầng 2, phòng 201',
        max_capacity: 6,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        slots: [],
        area_work_types: [
            {
                area_id: '8d7c6b5a-4321-0fed-cba9-876543210abc',
                work_type_id: '057b182b-94e1-477e-8362-e89df03c2faf',
                description: null,
                area: null,
                work_type: {
                    name: 'Food & Beverage ',
                    description: 'Phụ trách toàn bộ khu vực quầy bar và bàn khách, bao gồm pha chế, phục vụ đồ uống và thức ăn cho người, và duy trì vệ sinh, kiểm soát nguyên liệu tại khu vực F&B.',
                    is_active: true,
                    tasks: [],
                    area_work_types: [],
                    team_work_types: [],
                    id: '057b182b-94e1-477e-8362-e89df03c2faf',
                    created_at: '2025-10-27T12:31:22.371814+00:00',
                    created_by: '00000000-0000-0000-0000-000000000000',
                    updated_at: '2025-10-27T12:31:22.371814+00:00',
                    updated_by: null,
                    is_deleted: false
                },
                id: 'vip-wt-1',
                created_at: '2025-10-25T14:00:00.000000+00:00',
                created_by: '00000000-0000-0000-0000-000000000000',
                updated_at: '2025-10-25T14:00:00.000000+00:00',
                updated_by: null,
                is_deleted: false
            }
        ],
        created_at: '2025-10-25T14:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-25T14:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '7c6b5a4d-3210-fedc-ba98-7654321098ab',
        name: 'Sân Vườn Ngoài Trời',
        description: 'Khu vườn xanh mát với sân cỏ tự nhiên, cây xanh và mái che. Không gian lý tưởng cho thú cưng vận động và khách hàng thư giãn trong không khí trong lành.',
        location: 'Tầng trệt, khu vực ngoài trời phía sau',
        max_capacity: 30,
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1588421357574-87938a86fa28?w=800',
        slots: [],
        area_work_types: [
            {
                area_id: '7c6b5a4d-3210-fedc-ba98-7654321098ab',
                work_type_id: '7e7477a6-f481-4df6-b3fd-626944475fb5',
                description: null,
                area: null,
                work_type: {
                    name: 'Cat Zone Management ',
                    description: 'Chịu trách nhiệm quản lý, giám sát sức khỏe, cho ăn, dọn dẹp vệ sinh khu vực sinh hoạt của mèo, và đảm bảo tương tác an toàn giữa mèo với khách hàng trong khu vực Cat Zone.',
                    is_active: true,
                    tasks: [],
                    area_work_types: [],
                    team_work_types: [],
                    id: '7e7477a6-f481-4df6-b3fd-626944475fb5',
                    created_at: '2025-10-27T12:31:09.910051+00:00',
                    created_by: '00000000-0000-0000-0000-000000000000',
                    updated_at: '2025-10-27T12:31:09.910051+00:00',
                    updated_by: null,
                    is_deleted: false
                },
                id: 'garden-wt-1',
                created_at: '2025-10-24T09:00:00.000000+00:00',
                created_by: '00000000-0000-0000-0000-000000000000',
                updated_at: '2025-10-24T09:00:00.000000+00:00',
                updated_by: null,
                is_deleted: false
            },
            {
                area_id: '7c6b5a4d-3210-fedc-ba98-7654321098ab',
                work_type_id: 'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f',
                description: null,
                area: null,
                work_type: {
                    name: 'Dog Zone Management',
                    description: 'Chịu trách nhiệm quản lý, giám sát sức khỏe, cho ăn, dọn dẹp vệ sinh khu vực sinh hoạt của chó, và đảm bảo tương tác an toàn giữa chó với khách hàng trong khu vực Dog Zone.',
                    is_active: true,
                    tasks: [],
                    area_work_types: [],
                    team_work_types: [],
                    id: 'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f',
                    created_at: '2025-10-27T12:31:15.784363+00:00',
                    created_by: '00000000-0000-0000-0000-000000000000',
                    updated_at: '2025-10-27T12:31:15.784363+00:00',
                    updated_by: null,
                    is_deleted: false
                },
                id: 'garden-wt-2',
                created_at: '2025-10-24T09:00:00.000000+00:00',
                created_by: '00000000-0000-0000-0000-000000000000',
                updated_at: '2025-10-24T09:00:00.000000+00:00',
                updated_by: null,
                is_deleted: false
            },
            {
                area_id: '7c6b5a4d-3210-fedc-ba98-7654321098ab',
                work_type_id: '057b182b-94e1-477e-8362-e89df03c2faf',
                description: null,
                area: null,
                work_type: {
                    name: 'Food & Beverage ',
                    description: 'Phụ trách toàn bộ khu vực quầy bar và bàn khách, bao gồm pha chế, phục vụ đồ uống và thức ăn cho người, và duy trì vệ sinh, kiểm soát nguyên liệu tại khu vực F&B.',
                    is_active: true,
                    tasks: [],
                    area_work_types: [],
                    team_work_types: [],
                    id: '057b182b-94e1-477e-8362-e89df03c2faf',
                    created_at: '2025-10-27T12:31:22.371814+00:00',
                    created_by: '00000000-0000-0000-0000-000000000000',
                    updated_at: '2025-10-27T12:31:22.371814+00:00',
                    updated_by: null,
                    is_deleted: false
                },
                id: 'garden-wt-3',
                created_at: '2025-10-24T09:00:00.000000+00:00',
                created_by: '00000000-0000-0000-0000-000000000000',
                updated_at: '2025-10-24T09:00:00.000000+00:00',
                updated_by: null,
                is_deleted: false
            }
        ],
        created_at: '2025-10-24T09:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-24T09:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '6b5a4c3d-2109-fedc-ba87-654321097abc',
        name: 'Phòng Huấn Luyện & Training',
        description: 'Phòng rộng rãi với thiết bị huấn luyện chuyên nghiệp, gương lớn để quan sát và sàn chống trượt. Phù hợp cho việc dạy kỹ năng và hành vi cho thú cưng.',
        location: 'Tầng 2, phòng 203',
        max_capacity: 8,
        is_active: false,
        image_url: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800',
        slots: [],
        area_work_types: [],
        created_at: '2025-10-23T11:30:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T15:00:00.000000+00:00',
        updated_by: '00000000-0000-0000-0000-000000000000',
        is_deleted: false
    }
];

// Teams
export const MOCK_TEAMS = [
    {
        id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        name: 'Nhóm Chăm Sóc Khu Vực Mèo',
        description: 'Nhóm chuyên trách quản lý khu vực mèo, đảm bảo vệ sinh chuồng trại, cung cấp thức ăn, nước uống và chăm sóc sức khỏe ban đầu cho các bé mèo.',
        leader_id: '8ccb9b64-9c5f-47ab-8db8-21eb31f704ff',
        is_active: true,
        status: 'INACTIVE',
        leader: null, // Will be populated by API
        team_members: [], // Will be populated by API
        bookings: [],
        slots: [],
        daily_tasks: [],
        team_work_shifts: [], // Will be populated by API
        team_work_types: [], // Will be populated by API
        created_at: '2025-10-27T13:01:10.340811+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T13:01:10.340811+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '4d55bbb0-a1c1-4c03-98bf-c587f0713512',
        name: 'Nhóm Bán Hàng & Đồ Uống',
        description: 'Nhóm quản lý quầy bar và quầy bán lẻ, chịu trách nhiệm pha chế đồ uống, bán hàng, thu ngân và kiểm soát hàng tồn kho cho các mặt hàng tiêu dùng và quà lưu niệm.',
        leader_id: '48a7e46b-8542-4738-9e6c-dfa8e19fbd60',
        is_active: true,
        status: 'INACTIVE',
        leader: null, // Will be populated by API
        team_members: [], // Will be populated by API
        bookings: [],
        slots: [],
        daily_tasks: [],
        team_work_shifts: [], // Will be populated by API
        team_work_types: [], // Will be populated by API
        created_at: '2025-10-27T13:03:17.644603+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T13:03:17.644603+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789',
        name: 'Nhóm Chăm Sóc Khu Vực Chó',
        description: 'Nhóm chuyên trách quản lý khu vực chó, giám sát an toàn, huấn luyện cơ bản, cho ăn và đảm bảo vệ sinh trong khu vực sinh hoạt của chó. Quản lý tương tác giữa chó và khách hàng.',
        leader_id: '5d789abc-1234-5678-9abc-def123456789', // Phạm Văn Thành
        is_active: true,
        status: 'INACTIVE',
        leader: null,
        team_members: [],
        bookings: [],
        slots: [],
        daily_tasks: [],
        team_work_shifts: [],
        team_work_types: [],
        created_at: '2025-10-28T08:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'b2c3d4e5-f6a7-4890-b123-cdef45678901',
        name: 'Nhóm Chăm Sóc & Làm Đẹp',
        description: 'Nhóm chuyên nghiệp về chăm sóc và làm đẹp cho thú cưng, bao gồm tắm rửa, cắt tỉa lông, vệ sinh tai, cắt móng và các dịch vụ spa cao cấp.',
        leader_id: '6e890bcd-2345-6789-abcd-ef0123456790', // Võ Thị Mai Lan
        is_active: true,
        status: 'INACTIVE',
        leader: null,
        team_members: [],
        bookings: [],
        slots: [],
        daily_tasks: [],
        team_work_shifts: [],
        team_work_types: [],
        created_at: '2025-10-28T08:15:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:15:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'c3d4e5f6-a7b8-4901-c234-def567890123',
        name: 'Nhóm Phục Vụ VIP',
        description: 'Nhóm chuyên phục vụ khu vực VIP và khách hàng cao cấp, đảm bảo trải nghiệm đặc biệt với dịch vụ tận tâm, chu đáo và riêng tư.',
        leader_id: '7f901cde-3456-789a-bcde-f01234567891', // Đặng Quốc Huy
        is_active: true,
        status: 'INACTIVE',
        leader: null,
        team_members: [],
        bookings: [],
        slots: [],
        daily_tasks: [],
        team_work_shifts: [],
        team_work_types: [],
        created_at: '2025-10-28T08:30:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:30:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'd4e5f6a7-b8c9-4012-d345-ef6789012345',
        name: 'Nhóm Quản Lý Sân Vườn',
        description: 'Nhóm quản lý sân vườn ngoài trời, chăm sóc cây xanh, duy trì vệ sinh khu vực ngoài trời và đảm bảo an toàn cho thú cưng và khách hàng.',
        leader_id: '8g012def-4567-89ab-cdef-012345678902', // Bùi Thị Hồng Nhung
        is_active: true,
        status: 'INACTIVE',
        leader: null,
        team_members: [],
        bookings: [],
        slots: [],
        daily_tasks: [],
        team_work_shifts: [],
        team_work_types: [],
        created_at: '2025-10-28T08:45:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:45:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'e5f6a7b8-c9d0-4123-e456-f78901234567',
        name: 'Nhóm Chăm Sóc Khách Hàng',
        description: 'Nhóm chăm sóc khách hàng, tiếp đón, hướng dẫn và giải đáp thắc mắc. Xử lý booking, thanh toán và đảm bảo sự hài lòng của khách hàng.',
        leader_id: '9h123efg-5678-9abc-def0-123456789013', // Lý Minh Tuấn
        is_active: true,
        status: 'INACTIVE',
        leader: null,
        team_members: [],
        bookings: [],
        slots: [],
        daily_tasks: [],
        team_work_shifts: [],
        team_work_types: [],
        created_at: '2025-10-28T09:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T09:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    }
];

// Team Members
export const MOCK_TEAM_MEMBERS = [
    // Nhóm Chăm Sóc Khu Vực Mèo members (team leader: Nguyễn Văn A - 8ccb9b64-9c5f-47ab-8db8-21eb31f704ff)
    {
        id: '50a63c58-2691-4208-a451-8ee3eed0b9c8',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        employee_id: '6c899348-3038-45cb-b49e-48a5f498584f', // Trần Minh Đức
        is_active: true,
        team: null,
        employee: null, // Will be populated by API
        daily_schedules: [],
        created_at: '2025-10-27T13:05:18.491285+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T13:05:18.491285+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'tm-cat-2',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        employee_id: 'emp-ws-1', // Nguyễn Thị Lan
        is_active: true,
        team: null,
        employee: null,
        daily_schedules: [],
        created_at: '2025-10-27T13:05:20.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T13:05:20.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'tm-cat-3',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775',
        employee_id: 'emp-ws-2', // Phạm Văn Hùng
        is_active: true,
        team: null,
        employee: null,
        daily_schedules: [],
        created_at: '2025-10-27T13:05:22.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T13:05:22.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Bán Hàng & Đồ Uống members (team leader: Trần Thị B - 48a7e46b-8542-4738-9e6c-dfa8e19fbd60)
    {
        id: 'tm-sales-1',
        team_id: '4d55bbb0-a1c1-4c03-98bf-c587f0713512',
        employee_id: '4474a3ef-9bb2-49fd-8904-86ff6b03a40c', // Lê Thị Thu Hương
        is_active: true,
        team: null,
        employee: null,
        daily_schedules: [],
        created_at: '2025-10-27T13:05:25.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T13:05:25.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'tm-sales-2',
        team_id: '4d55bbb0-a1c1-4c03-98bf-c587f0713512',
        employee_id: 'emp-sale-1', // Trần Minh Tâm
        is_active: true,
        team: null,
        employee: null,
        daily_schedules: [],
        created_at: '2025-10-27T13:05:30.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T13:05:30.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'tm-sales-3',
        team_id: '4d55bbb0-a1c1-4c03-98bf-c587f0713512',
        employee_id: 'emp-sale-2', // Nguyễn Hoàng Nam
        is_active: true,
        team: null,
        employee: null,
        daily_schedules: [],
        created_at: '2025-10-27T13:05:32.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T13:05:32.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'tm-sales-4',
        team_id: '4d55bbb0-a1c1-4c03-98bf-c587f0713512',
        employee_id: 'emp-ws-3', // Lê Thị Mai
        is_active: true,
        team: null,
        employee: null,
        daily_schedules: [],
        created_at: '2025-10-27T13:05:34.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T13:05:34.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Chăm Sóc Khu Vực Chó members (team leader: Phạm Văn Thành - 5d789abc-1234-5678-9abc-def123456789)
    {
        id: 'tm-dog-1',
        team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789',
        employee_id: '0i234fgh-6789-abcd-ef01-234567890124', // Hoàng Thị Ngọc Anh
        is_active: true,
        team: null,
        employee: null,
        daily_schedules: [],
        created_at: '2025-10-28T08:05:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:05:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'tm-dog-2',
        team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789',
        employee_id: '1j345ghi-789a-bcde-f012-345678901235', // Trương Văn Kiên
        is_active: true,
        team: null,
        employee: null,
        daily_schedules: [],
        created_at: '2025-10-28T08:06:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:06:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Chăm Sóc & Làm Đẹp members (team leader: Võ Thị Mai Lan - 6e890bcd-2345-6789-abcd-ef0123456790)
    {
        id: 'tm-groom-1',
        team_id: 'b2c3d4e5-f6a7-4890-b123-cdef45678901',
        employee_id: '2k456hij-89ab-cdef-0123-456789012346', // Phan Thị Mỹ Duyên
        is_active: true,
        team: null,
        employee: null,
        daily_schedules: [],
        created_at: '2025-10-28T08:20:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:20:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'tm-groom-2',
        team_id: 'b2c3d4e5-f6a7-4890-b123-cdef45678901',
        employee_id: '3l567ijk-9abc-def0-1234-567890123457', // Ngô Văn Tài
        is_active: true,
        team: null,
        employee: null,
        daily_schedules: [],
        created_at: '2025-10-28T08:21:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:21:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Phục Vụ VIP members (team leader: Đặng Quốc Huy - 7f901cde-3456-789a-bcde-f01234567891)
    {
        id: 'tm-vip-1',
        team_id: 'c3d4e5f6-a7b8-4901-c234-def567890123',
        employee_id: '4m678jkl-abcd-ef01-2345-678901234568', // Đinh Thị Kim Oanh
        is_active: true,
        team: null,
        employee: null,
        daily_schedules: [],
        created_at: '2025-10-28T08:35:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:35:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'tm-vip-2',
        team_id: 'c3d4e5f6-a7b8-4901-c234-def567890123',
        employee_id: 'emp-sale-1', // Trần Minh Tâm
        is_active: true,
        team: null,
        employee: null,
        daily_schedules: [],
        created_at: '2025-10-28T08:36:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:36:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Quản Lý Sân Vườn members (team leader: Bùi Thị Hồng Nhung - 8g012def-4567-89ab-cdef-012345678902)
    {
        id: 'tm-outdoor-1',
        team_id: 'd4e5f6a7-b8c9-4012-d345-ef6789012345',
        employee_id: 'emp-ws-1', // Nguyễn Thị Lan
        is_active: true,
        team: null,
        employee: null,
        daily_schedules: [],
        created_at: '2025-10-28T08:50:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:50:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'tm-outdoor-2',
        team_id: 'd4e5f6a7-b8c9-4012-d345-ef6789012345',
        employee_id: 'emp-ws-2', // Phạm Văn Hùng
        is_active: true,
        team: null,
        employee: null,
        daily_schedules: [],
        created_at: '2025-10-28T08:51:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:51:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Chăm Sóc Khách Hàng members (team leader: Lý Minh Tuấn - 9h123efg-5678-9abc-def0-123456789013)
    {
        id: 'tm-cs-1',
        team_id: 'e5f6a7b8-c9d0-4123-e456-f78901234567',
        employee_id: 'emp-sale-2', // Nguyễn Hoàng Nam
        is_active: true,
        team: null,
        employee: null,
        daily_schedules: [],
        created_at: '2025-10-28T09:05:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T09:05:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'tm-cs-2',
        team_id: 'e5f6a7b8-c9d0-4123-e456-f78901234567',
        employee_id: '6c899348-3038-45cb-b49e-48a5f498584f', // Trần Minh Đức
        is_active: true,
        team: null,
        employee: null,
        daily_schedules: [],
        created_at: '2025-10-28T09:06:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T09:06:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    }
];

// Team Work Shifts (Liên kết Team với Work Shift)
// Team Work Types (junction table between teams and work types)
export const MOCK_TEAM_WORK_TYPES = [
    // Nhóm Chăm Sóc Khu Vực Mèo - Cat Zone Management
    {
        id: 'twt-1',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775', // Nhóm Chăm Sóc Khu Vực Mèo
        work_type_id: '7e7477a6-f481-4df6-b3fd-626944475fb5', // Cat Zone Management
        team: null,
        work_type: null,
        created_at: '2025-10-27T13:01:10.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T13:01:10.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Bán Hàng & Đồ Uống - Food & Beverage
    {
        id: 'twt-2',
        team_id: '4d55bbb0-a1c1-4c03-98bf-c587f0713512', // Nhóm Bán Hàng & Đồ Uống
        work_type_id: '057b182b-94e1-477e-8362-e89df03c2faf', // Food & Beverage
        team: null,
        work_type: null,
        created_at: '2025-10-27T13:03:17.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T13:03:17.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Chăm Sóc Khu Vực Chó - Dog Zone Management
    {
        id: 'twt-3',
        team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789', // Nhóm Chăm Sóc Khu Vực Chó
        work_type_id: 'b0c8a471-3b55-4038-9642-b598c072ea45', // Dog Zone Management
        team: null,
        work_type: null,
        created_at: '2025-10-28T08:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Chăm Sóc & Làm Đẹp - Cat Zone Management (grooming for all pets)
    {
        id: 'twt-4',
        team_id: 'b2c3d4e5-f6a7-4890-b123-cdef45678901', // Nhóm Chăm Sóc & Làm Đẹp
        work_type_id: '7e7477a6-f481-4df6-b3fd-626944475fb5', // Cat Zone Management
        team: null,
        work_type: null,
        created_at: '2025-10-28T08:15:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:15:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Phục Vụ VIP - Food & Beverage
    {
        id: 'twt-5',
        team_id: 'c3d4e5f6-a7b8-4901-c234-def567890123', // Nhóm Phục Vụ VIP
        work_type_id: '057b182b-94e1-477e-8362-e89df03c2faf', // Food & Beverage
        team: null,
        work_type: null,
        created_at: '2025-10-28T08:30:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:30:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Quản Lý Sân Vườn - Cat Zone Management (general pet care)
    {
        id: 'twt-6',
        team_id: 'd4e5f6a7-b8c9-4012-d345-ef6789012345', // Nhóm Quản Lý Sân Vườn
        work_type_id: '7e7477a6-f481-4df6-b3fd-626944475fb5', // Cat Zone Management
        team: null,
        work_type: null,
        created_at: '2025-10-28T08:45:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:45:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Chăm Sóc Khách Hàng - Food & Beverage (customer service)
    {
        id: 'twt-7',
        team_id: 'e5f6a7b8-c9d0-4123-e456-f78901234567', // Nhóm Chăm Sóc Khách Hàng
        work_type_id: '057b182b-94e1-477e-8362-e89df03c2faf', // Food & Beverage
        team: null,
        work_type: null,
        created_at: '2025-10-28T09:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T09:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    }
];

export const MOCK_TEAM_WORK_SHIFTS = [
    // Nhóm Chăm Sóc Khu Vực Mèo - Ca Sáng
    {
        id: 'tws-1',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775', // Nhóm Chăm Sóc Khu Vực Mèo
        work_shift_id: 'aa5153ab-b361-40ac-bdfe-119191cdad89', // Ca Sáng (07:30-12:00)
        team: null,
        work_shift: null,
        created_at: '2025-10-27T13:35:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T13:35:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Chăm Sóc Khu Vực Mèo - Ca Chiều Cao Điểm
    {
        id: 'tws-2',
        team_id: '73db584f-89ba-4ac0-ae2e-4c559a907775', // Nhóm Chăm Sóc Khu Vực Mèo
        work_shift_id: 'cd24631d-084b-4db8-b1a4-5b48dbac3b21', // Ca Chiều Cao Điểm (12:00-17:00)
        team: null,
        work_shift: null,
        created_at: '2025-10-27T13:35:05.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T13:35:05.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Bán Hàng & Đồ Uống - Ca Chiều Cao Điểm
    {
        id: 'tws-3',
        team_id: '4d55bbb0-a1c1-4c03-98bf-c587f0713512', // Nhóm Bán Hàng & Đồ Uống
        work_shift_id: 'cd24631d-084b-4db8-b1a4-5b48dbac3b21', // Ca Chiều Cao Điểm (12:00-17:00)
        team: null,
        work_shift: null,
        created_at: '2025-10-27T13:35:10.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T13:35:10.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Bán Hàng & Đồ Uống - Ca Tối & Đóng Cửa
    {
        id: 'tws-4',
        team_id: '4d55bbb0-a1c1-4c03-98bf-c587f0713512', // Nhóm Bán Hàng & Đồ Uống
        work_shift_id: 'bb2310ba-58c6-4466-9e8a-371b2d2e6331', // Ca Tối & Đóng Cửa (17:00-21:30)
        team: null,
        work_shift: null,
        created_at: '2025-10-27T13:35:15.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T13:35:15.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Chăm Sóc Khu Vực Chó - Ca Sáng
    {
        id: 'tws-5',
        team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789', // Nhóm Chăm Sóc Khu Vực Chó
        work_shift_id: 'aa5153ab-b361-40ac-bdfe-119191cdad89', // Ca Sáng (07:30-12:00)
        team: null,
        work_shift: null,
        created_at: '2025-10-28T08:01:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:01:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Chăm Sóc Khu Vực Chó - Ca Tối & Đóng Cửa
    {
        id: 'tws-6',
        team_id: 'a1b2c3d4-e5f6-4789-a012-bcdef3456789', // Nhóm Chăm Sóc Khu Vực Chó
        work_shift_id: 'bb2310ba-58c6-4466-9e8a-371b2d2e6331', // Ca Tối & Đóng Cửa (17:00-21:30)
        team: null,
        work_shift: null,
        created_at: '2025-10-28T08:02:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:02:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Chăm Sóc & Làm Đẹp - Ca Sáng
    {
        id: 'tws-7',
        team_id: 'b2c3d4e5-f6a7-4890-b123-cdef45678901', // Nhóm Chăm Sóc & Làm Đẹp
        work_shift_id: 'aa5153ab-b361-40ac-bdfe-119191cdad89', // Ca Sáng (07:30-12:00)
        team: null,
        work_shift: null,
        created_at: '2025-10-28T08:16:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:16:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Chăm Sóc & Làm Đẹp - Ca Chiều Cao Điểm
    {
        id: 'tws-8',
        team_id: 'b2c3d4e5-f6a7-4890-b123-cdef45678901', // Nhóm Chăm Sóc & Làm Đẹp
        work_shift_id: 'cd24631d-084b-4db8-b1a4-5b48dbac3b21', // Ca Chiều Cao Điểm (12:00-17:00)
        team: null,
        work_shift: null,
        created_at: '2025-10-28T08:17:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:17:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Chăm Sóc & Làm Đẹp - Ca Tối & Đóng Cửa
    {
        id: 'tws-9',
        team_id: 'b2c3d4e5-f6a7-4890-b123-cdef45678901', // Nhóm Chăm Sóc & Làm Đẹp
        work_shift_id: 'bb2310ba-58c6-4466-9e8a-371b2d2e6331', // Ca Tối & Đóng Cửa (17:00-21:30)
        team: null,
        work_shift: null,
        created_at: '2025-10-28T08:18:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:18:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Phục Vụ VIP - Ca Chiều Cao Điểm
    {
        id: 'tws-10',
        team_id: 'c3d4e5f6-a7b8-4901-c234-def567890123', // Nhóm Phục Vụ VIP
        work_shift_id: 'cd24631d-084b-4db8-b1a4-5b48dbac3b21', // Ca Chiều Cao Điểm (12:00-17:00)
        team: null,
        work_shift: null,
        created_at: '2025-10-28T08:31:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:31:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Phục Vụ VIP - Ca Tối & Đóng Cửa
    {
        id: 'tws-11',
        team_id: 'c3d4e5f6-a7b8-4901-c234-def567890123', // Nhóm Phục Vụ VIP
        work_shift_id: 'bb2310ba-58c6-4466-9e8a-371b2d2e6331', // Ca Tối & Đóng Cửa (17:00-21:30)
        team: null,
        work_shift: null,
        created_at: '2025-10-28T08:32:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:32:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Quản Lý Sân Vườn - Ca Sáng
    {
        id: 'tws-12',
        team_id: 'd4e5f6a7-b8c9-4012-d345-ef6789012345', // Nhóm Quản Lý Sân Vườn
        work_shift_id: 'aa5153ab-b361-40ac-bdfe-119191cdad89', // Ca Sáng (07:30-12:00)
        team: null,
        work_shift: null,
        created_at: '2025-10-28T08:46:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:46:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Quản Lý Sân Vườn - Ca Chiều Cao Điểm
    {
        id: 'tws-13',
        team_id: 'd4e5f6a7-b8c9-4012-d345-ef6789012345', // Nhóm Quản Lý Sân Vườn
        work_shift_id: 'cd24631d-084b-4db8-b1a4-5b48dbac3b21', // Ca Chiều Cao Điểm (12:00-17:00)
        team: null,
        work_shift: null,
        created_at: '2025-10-28T08:47:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T08:47:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Chăm Sóc Khách Hàng - Ca Sáng
    {
        id: 'tws-14',
        team_id: 'e5f6a7b8-c9d0-4123-e456-f78901234567', // Nhóm Chăm Sóc Khách Hàng
        work_shift_id: 'aa5153ab-b361-40ac-bdfe-119191cdad89', // Ca Sáng (07:30-12:00)
        team: null,
        work_shift: null,
        created_at: '2025-10-28T09:01:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T09:01:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Chăm Sóc Khách Hàng - Ca Chiều Cao Điểm
    {
        id: 'tws-15',
        team_id: 'e5f6a7b8-c9d0-4123-e456-f78901234567', // Nhóm Chăm Sóc Khách Hàng
        work_shift_id: 'cd24631d-084b-4db8-b1a4-5b48dbac3b21', // Ca Chiều Cao Điểm (12:00-17:00)
        team: null,
        work_shift: null,
        created_at: '2025-10-28T09:02:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T09:02:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Nhóm Chăm Sóc Khách Hàng - Ca Tối & Đóng Cửa
    {
        id: 'tws-16',
        team_id: 'e5f6a7b8-c9d0-4123-e456-f78901234567', // Nhóm Chăm Sóc Khách Hàng
        work_shift_id: 'bb2310ba-58c6-4466-9e8a-371b2d2e6331', // Ca Tối & Đóng Cửa (17:00-21:30)
        team: null,
        work_shift: null,
        created_at: '2025-10-28T09:03:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T09:03:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    }
];

// Employees (Nhân viên)
export const MOCK_EMPLOYEES = [
    {
        id: '8ccb9b64-9c5f-47ab-8db8-21eb31f704ff',
        account_id: '4cba3b00-dadd-4264-a240-f55dc587042e',
        full_name: 'Nguyễn Văn A',
        avatar_url: 'https://firebasestorage.googleapis.com/v0/b/digital-dynamo-cb555.appspot.com/o/assets%2Fimages%2F41a972e1-ccfe-417a-b201-604f0272db69.jpg?alt=media&token=76d75cfa-5e43-4871-a18d-68720b9bbd1f',
        email: 'nguyenvana@gmail.com',
        phone: '0901234567',
        address: '123 Đường Mèo Vạc, Quận 1, TP. HCM',
        skills: ['Pha chế cà phê cơ bản', 'Chăm sóc mèo', 'Giao tiếp tốt', 'Quản lý đơn hàng'],
        salary: 7000000,
        sub_role: 'WORKING_STAFF',
        account: {
            username: 'Nguyễn Văn A',
            email: 'nguyenvana@gmail.com',
            password_hash: '$2a$12$WMop.Y48ToNEW8xfdmBzk.jUO.WbiCsZ3lycZntJs0qm4sxfEFnne',
            role: 'EMPLOYEE',
            is_active: true,
            customer: null,
            employee: null,
            notifications: [],
            id: '4cba3b00-dadd-4264-a240-f55dc587042e',
            created_at: '2025-10-27T06:04:10.71657+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-27T06:04:10.716571+00:00',
            updated_by: null,
            is_deleted: false
        },
        team_members: [],
        orders: [],
        daily_schedules: [],
        created_at: '2025-10-27T06:04:10.716571+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:04:10.716571+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '48a7e46b-8542-4738-9e6c-dfa8e19fbd60',
        account_id: '2c2f0d0a-0088-4a84-af92-bbed98601066',
        full_name: 'Trần Thị B',
        avatar_url: 'https://firebasestorage.googleapis.com/v0/b/digital-dynamo-cb555.appspot.com/o/assets%2Fimages%2Feaaad35a-12de-42b8-b52b-8b25b9011b5f.jpg?alt=media&token=0315000d-d680-48c7-a0fc-c1c9655afac9',
        email: 'levanc@gmail.com',
        phone: '0987654432',
        address: '456 Phố Miu Miu, Quận 3, TP. HCM',
        skills: ['Phục vụ bàn', 'Sử dụng mạng xã hội (Instagram, TikTok)', 'Chụp ảnh/quay video sản phẩm', 'Xử lý khiếu nại khách hàng'],
        salary: 6500000,
        sub_role: 'SALE_STAFF',
        account: {
            username: 'Trần Thị B',
            email: 'levanc@gmail.com',
            password_hash: '$2a$12$DmSqdsjkCwFPAWGzeDoMduoP4JwOD6nANuAS0EKfp3Y.ldclJcfAq',
            role: 'EMPLOYEE',
            is_active: true,
            customer: null,
            employee: null,
            notifications: [],
            id: '2c2f0d0a-0088-4a84-af92-bbed98601066',
            created_at: '2025-10-27T06:08:52.825153+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-27T06:08:52.825153+00:00',
            updated_by: null,
            is_deleted: false
        },
        team_members: [],
        orders: [],
        daily_schedules: [],
        created_at: '2025-10-27T06:08:52.825155+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:08:52.825155+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '6c899348-3038-45cb-b49e-48a5f498584f',
        account_id: '001d9e4f-fe0b-4476-8648-ee31a674ae12',
        full_name: 'Trần Minh Đức',
        avatar_url: 'https://firebasestorage.googleapis.com/v0/b/digital-dynamo-cb555.appspot.com/o/assets%2Fimages%2F6d1be90d-13fc-43c5-a301-1df1814025c5.jpg?alt=media&token=bdb46fe3-291c-4ab3-9240-4cd4b5bc6f53',
        email: 'minhduc.working@petcafe.com',
        phone: '0912345999',
        address: '30 Đường Hoàng Hoa Thám, Quận 1, TP. HCM',
        skills: ['Chăm sóc mèo cơ bản', 'Pha chế cơ bản', 'Xử lý tình huống khẩn cấp', 'Vệ sinh khu vực'],
        salary: 6500000,
        sub_role: 'WORKING_STAFF',
        account: {
            username: 'Trần Minh Đức',
            email: 'minhduc.working@petcafe.com',
            password_hash: '$2a$12$yvqHzerOwWT3jZfBR5zwgO/3Q4QR3FfmA6MMb.6sQeanuDo.gQNZW',
            role: 'EMPLOYEE',
            is_active: true,
            customer: null,
            employee: null,
            notifications: [],
            id: '001d9e4f-fe0b-4476-8648-ee31a674ae12',
            created_at: '2025-10-27T12:51:37.924335+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-27T12:51:37.924336+00:00',
            updated_by: null,
            is_deleted: false
        },
        team_members: [],
        orders: [],
        daily_schedules: [],
        created_at: '2025-10-27T12:51:37.924336+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T12:51:37.924336+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '4474a3ef-9bb2-49fd-8904-86ff6b03a40c',
        account_id: 'fdfe3c24-6d30-4e93-93ab-b07516b3b712',
        full_name: 'Lê Thị Thu Hương',
        avatar_url: 'https://firebasestorage.googleapis.com/v0/b/digital-dynamo-cb555.appspot.com/o/assets%2Fimages%2Fe5f293ca-4972-4316-89fa-d89e29eb7e28.webp?alt=media&token=694f0759-45da-4c84-a9a1-ba55421a54e6',
        email: 'thuhuong.sales@petcafe.com',
        phone: '0987654320',
        address: '45 Đường Nguyễn Đình Chiểu, Quận 3, TP. HCM',
        skills: ['Tư vấn bán hàng', 'Quản lý tồn kho', 'Marketing sản phẩm', 'Giao tiếp khách hàng'],
        salary: 7000000,
        sub_role: 'SALE_STAFF',
        account: {
            username: 'Lê Thị Thu Hương',
            email: 'thuhuong.sales@petcafe.com',
            password_hash: '$2a$12$.fyc53zNEYa9.cB8Ur4HI.1gaLLGBKEne2NXCsIsU4zCAtVAls70m',
            role: 'EMPLOYEE',
            is_active: true,
            customer: null,
            employee: null,
            notifications: [],
            id: 'fdfe3c24-6d30-4e93-93ab-b07516b3b712',
            created_at: '2025-10-27T12:52:04.187627+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-27T12:52:04.187627+00:00',
            updated_by: null,
            is_deleted: false
        },
        team_members: [],
        orders: [],
        daily_schedules: [],
        created_at: '2025-10-27T12:52:04.187628+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T12:52:04.187628+00:00',
        updated_by: null,
        is_deleted: false
    },
    // ===== THÊM NHÂN VIÊN MỚI =====
    {
        id: '5d789abc-1234-5678-9abc-def123456789',
        account_id: 'acc12345-6789-abcd-ef01-234567890abc',
        full_name: 'Phạm Văn Thành',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        email: 'phamvanthanh.working@petcafe.com',
        phone: '0903456789',
        address: '78 Đường Lê Lợi, Quận 1, TP. HCM',
        skills: ['Chăm sóc chó cỡ lớn', 'Huấn luyện thú cưng cơ bản', 'Sơ cứu thú y', 'Vệ sinh chuồng trại'],
        salary: 7500000,
        sub_role: 'WORKING_STAFF',
        account: {
            username: 'Phạm Văn Thành',
            email: 'phamvanthanh.working@petcafe.com',
            password_hash: '$2a$12$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJK',
            role: 'EMPLOYEE',
            is_active: true,
            customer: null,
            employee: null,
            notifications: [],
            id: 'acc12345-6789-abcd-ef01-234567890abc',
            created_at: '2025-10-25T08:00:00+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-25T08:00:00+00:00',
            updated_by: null,
            is_deleted: false
        },
        team_members: [],
        orders: [],
        daily_schedules: [],
        created_at: '2025-10-25T08:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-25T08:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '6e890bcd-2345-6789-abcd-ef0123456790',
        account_id: 'acc23456-789a-bcde-f012-34567890bcde',
        full_name: 'Võ Thị Mai Lan',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        email: 'vomailan.sales@petcafe.com',
        phone: '0905678901',
        address: '234 Đường Pasteur, Quận 3, TP. HCM',
        skills: ['Tư vấn sản phẩm thú cưng', 'Quản lý kho hàng', 'Chăm sóc khách hàng VIP', 'Thiết kế combo quà tặng'],
        salary: 7200000,
        sub_role: 'SALE_STAFF',
        account: {
            username: 'Võ Thị Mai Lan',
            email: 'vomailan.sales@petcafe.com',
            password_hash: '$2a$12$bcdefghijklmnopqrstuvwxyz234567890ABCDEFGHIJKL',
            role: 'EMPLOYEE',
            is_active: true,
            customer: null,
            employee: null,
            notifications: [],
            id: 'acc23456-789a-bcde-f012-34567890bcde',
            created_at: '2025-10-24T09:30:00+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-24T09:30:00+00:00',
            updated_by: null,
            is_deleted: false
        },
        team_members: [],
        orders: [],
        daily_schedules: [],
        created_at: '2025-10-24T09:30:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-24T09:30:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '7f901cde-3456-789a-bcde-f01234567891',
        account_id: 'acc34567-89ab-cdef-0123-4567890cdef1',
        full_name: 'Đặng Quốc Huy',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        email: 'dangquochuy.working@petcafe.com',
        phone: '0907890123',
        address: '567 Đường Trần Hưng Đạo, Quận 5, TP. HCM',
        skills: ['Chăm sóc mèo Persian', 'Tắm rửa và cắt tỉa lông', 'Kiểm tra sức khỏe định kỳ', 'Quản lý hồ sơ thú cưng'],
        salary: 6800000,
        sub_role: 'WORKING_STAFF',
        account: {
            username: 'Đặng Quốc Huy',
            email: 'dangquochuy.working@petcafe.com',
            password_hash: '$2a$12$cdefghijklmnopqrstuvwxyz34567890ABCDEFGHIJKLM',
            role: 'EMPLOYEE',
            is_active: true,
            customer: null,
            employee: null,
            notifications: [],
            id: 'acc34567-89ab-cdef-0123-4567890cdef1',
            created_at: '2025-10-23T10:15:00+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-23T10:15:00+00:00',
            updated_by: null,
            is_deleted: false
        },
        team_members: [],
        orders: [],
        daily_schedules: [],
        created_at: '2025-10-23T10:15:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-23T10:15:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '8g012def-4567-89ab-cdef-012345678902',
        account_id: 'acc45678-9abc-def0-1234-567890def012',
        full_name: 'Bùi Thị Hồng Nhung',
        avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
        email: 'buihongnhung.sales@petcafe.com',
        phone: '0909012345',
        address: '890 Đường Cách Mạng Tháng 8, Quận 10, TP. HCM',
        skills: ['Bán hàng online', 'Content marketing', 'Livestream bán hàng', 'Xử lý đơn hàng'],
        salary: 6900000,
        sub_role: 'SALE_STAFF',
        account: {
            username: 'Bùi Thị Hồng Nhung',
            email: 'buihongnhung.sales@petcafe.com',
            password_hash: '$2a$12$defghijklmnopqrstuvwxyz4567890ABCDEFGHIJKLMN',
            role: 'EMPLOYEE',
            is_active: false, // ← INACTIVE
            customer: null,
            employee: null,
            notifications: [],
            id: 'acc45678-9abc-def0-1234-567890def012',
            created_at: '2025-10-22T11:45:00+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-28T14:30:00+00:00',
            updated_by: null,
            is_deleted: false
        },
        team_members: [],
        orders: [],
        daily_schedules: [],
        created_at: '2025-10-22T11:45:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T14:30:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '9h123efg-5678-9abc-def0-123456789013',
        account_id: 'acc56789-abcd-ef01-2345-67890ef01234',
        full_name: 'Lý Minh Tuấn',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
        email: 'lyminhtuan.working@petcafe.com',
        phone: '0910123456',
        address: '12 Đường Võ Thị Sáu, Quận 3, TP. HCM',
        skills: ['Chăm sóc chó Corgi', 'Training thú cưng nâng cao', 'Dinh dưỡng thú cưng', 'Phòng bệnh cho thú cưng'],
        salary: 8000000,
        sub_role: 'WORKING_STAFF',
        account: {
            username: 'Lý Minh Tuấn',
            email: 'lyminhtuan.working@petcafe.com',
            password_hash: '$2a$12$efghijklmnopqrstuvwxyz567890ABCDEFGHIJKLMNO',
            role: 'EMPLOYEE',
            is_active: true,
            customer: null,
            employee: null,
            notifications: [],
            id: 'acc56789-abcd-ef01-2345-67890ef01234',
            created_at: '2025-10-21T13:00:00+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-21T13:00:00+00:00',
            updated_by: null,
            is_deleted: false
        },
        team_members: [],
        orders: [],
        daily_schedules: [],
        created_at: '2025-10-21T13:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-21T13:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '0i234fgh-6789-abcd-ef01-234567890124',
        account_id: 'acc67890-bcde-f012-3456-7890f0123456',
        full_name: 'Hoàng Thị Ngọc Anh',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
        email: 'hoangnocanh.sales@petcafe.com',
        phone: '0911234567',
        address: '345 Đường Điện Biên Phủ, Quận Bình Thạnh, TP. HCM',
        skills: ['Tư vấn dịch vụ cao cấp', 'Quản lý booking', 'Chăm sóc khách hàng doanh nghiệp', 'Upselling'],
        salary: 7800000,
        sub_role: 'SALE_STAFF',
        account: {
            username: 'Hoàng Thị Ngọc Anh',
            email: 'hoangnocanh.sales@petcafe.com',
            password_hash: '$2a$12$fghijklmnopqrstuvwxyz67890ABCDEFGHIJKLMNOP',
            role: 'EMPLOYEE',
            is_active: true,
            customer: null,
            employee: null,
            notifications: [],
            id: 'acc67890-bcde-f012-3456-7890f0123456',
            created_at: '2025-10-20T14:20:00+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-20T14:20:00+00:00',
            updated_by: null,
            is_deleted: false
        },
        team_members: [],
        orders: [],
        daily_schedules: [],
        created_at: '2025-10-20T14:20:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-20T14:20:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '1j345ghi-789a-bcde-f012-345678901235',
        account_id: 'acc78901-cdef-0123-4567-8901f0123567',
        full_name: 'Trương Văn Kiên',
        avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
        email: 'truongvankien.working@petcafe.com',
        phone: '0912345678',
        address: '678 Đường Lý Thường Kiệt, Quận 11, TP. HCM',
        skills: ['Chăm sóc chó Golden Retriever', 'Vận động và chơi đùa với thú cưng', 'Kiểm soát hành vi', 'Dọn dẹp khu vực'],
        salary: 6600000,
        sub_role: 'WORKING_STAFF',
        account: {
            username: 'Trương Văn Kiên',
            email: 'truongvankien.working@petcafe.com',
            password_hash: '$2a$12$ghijklmnopqrstuvwxyz7890ABCDEFGHIJKLMNOPQ',
            role: 'EMPLOYEE',
            is_active: false, // ← INACTIVE
            customer: null,
            employee: null,
            notifications: [],
            id: 'acc78901-cdef-0123-4567-8901f0123567',
            created_at: '2025-10-19T15:30:00+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-29T10:00:00+00:00',
            updated_by: null,
            is_deleted: false
        },
        team_members: [],
        orders: [],
        daily_schedules: [],
        created_at: '2025-10-19T15:30:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-29T10:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '2k456hij-89ab-cdef-0123-456789012346',
        account_id: 'acc89012-def0-1234-5678-9012f0123678',
        full_name: 'Phan Thị Mỹ Duyên',
        avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        email: 'phanmyduyen.sales@petcafe.com',
        phone: '0913456789',
        address: '901 Đường Nguyễn Thị Minh Khai, Quận 1, TP. HCM',
        skills: ['Bán hàng trực tiếp', 'Cross-selling', 'Chăm sóc sau bán hàng', 'Quản lý đổi trả hàng'],
        salary: 7100000,
        sub_role: 'SALE_STAFF',
        account: {
            username: 'Phan Thị Mỹ Duyên',
            email: 'phanmyduyen.sales@petcafe.com',
            password_hash: '$2a$12$hijklmnopqrstuvwxyz890ABCDEFGHIJKLMNOPQR',
            role: 'EMPLOYEE',
            is_active: true,
            customer: null,
            employee: null,
            notifications: [],
            id: 'acc89012-def0-1234-5678-9012f0123678',
            created_at: '2025-10-18T16:45:00+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-18T16:45:00+00:00',
            updated_by: null,
            is_deleted: false
        },
        team_members: [],
        orders: [],
        daily_schedules: [],
        created_at: '2025-10-18T16:45:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-18T16:45:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '3l567ijk-9abc-def0-1234-567890123457',
        account_id: 'acc90123-ef01-2345-6789-0123f0123789',
        full_name: 'Ngô Văn Tài',
        avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
        email: 'ngovantai.working@petcafe.com',
        phone: '0914567890',
        address: '234 Đường Phan Xích Long, Quận Phú Nhuận, TP. HCM',
        skills: ['Chăm sóc chó Shiba Inu', 'Grooming thú cưng', 'Kiểm tra sức khỏe tổng quát', 'Báo cáo hàng ngày'],
        salary: 7300000,
        sub_role: 'WORKING_STAFF',
        account: {
            username: 'Ngô Văn Tài',
            email: 'ngovantai.working@petcafe.com',
            password_hash: '$2a$12$ijklmnopqrstuvwxyz90ABCDEFGHIJKLMNOPQRS',
            role: 'EMPLOYEE',
            is_active: true,
            customer: null,
            employee: null,
            notifications: [],
            id: 'acc90123-ef01-2345-6789-0123f0123789',
            created_at: '2025-10-17T17:00:00+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-17T17:00:00+00:00',
            updated_by: null,
            is_deleted: false
        },
        team_members: [],
        orders: [],
        daily_schedules: [],
        created_at: '2025-10-17T17:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-17T17:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '4m678jkl-abcd-ef01-2345-678901234568',
        account_id: 'acc01234-f012-3456-789a-bcdef0123890',
        full_name: 'Đinh Thị Kim Oanh',
        avatar_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
        email: 'dinhkimoanh.sales@petcafe.com',
        phone: '0915678901',
        address: '567 Đường Hai Bà Trưng, Quận 1, TP. HCM',
        skills: ['Telesales', 'Email marketing', 'Chăm sóc khách hàng qua điện thoại', 'Xử lý phản hồi'],
        salary: 6700000,
        sub_role: 'SALE_STAFF',
        account: {
            username: 'Đinh Thị Kim Oanh',
            email: 'dinhkimoanh.sales@petcafe.com',
            password_hash: '$2a$12$jklmnopqrstuvwxyz0ABCDEFGHIJKLMNOPQRST',
            role: 'EMPLOYEE',
            is_active: true,
            customer: null,
            employee: null,
            notifications: [],
            id: 'acc01234-f012-3456-789a-bcdef0123890',
            created_at: '2025-10-16T08:30:00+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-16T08:30:00+00:00',
            updated_by: null,
            is_deleted: false
        },
        team_members: [],
        orders: [],
        daily_schedules: [],
        created_at: '2025-10-16T08:30:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-16T08:30:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    // Additional team members
    {
        id: 'emp-ws-1',
        account_id: 'acc-ws-1',
        full_name: 'Nguyễn Thị Lan',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        email: 'nguyenlan.working@petcafe.com',
        phone: '0923456789',
        address: '45 Đường Lê Lợi, Quận 1, TP. HCM',
        skills: ['Chăm sóc mèo', 'Vệ sinh chuồng trại', 'Cho ăn'],
        salary: 6800000,
        sub_role: 'WORKING_STAFF',
        account: {
            username: 'Nguyễn Thị Lan',
            email: 'nguyenlan.working@petcafe.com',
            password_hash: '$2a$12$hash',
            role: 'EMPLOYEE',
            is_active: true,
            customer: null,
            employee: null,
            notifications: [],
            id: 'acc-ws-1',
            created_at: '2025-10-20T08:00:00+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-20T08:00:00+00:00',
            updated_by: null,
            is_deleted: false
        },
        team_members: [],
        orders: [],
        daily_schedules: [],
        created_at: '2025-10-20T08:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-20T08:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'emp-ws-2',
        account_id: 'acc-ws-2',
        full_name: 'Phạm Văn Hùng',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        email: 'phamhung.working@petcafe.com',
        phone: '0934567890',
        address: '78 Đường Trần Hưng Đạo, Quận 5, TP. HCM',
        skills: ['Chăm sóc mèo nâng cao', 'Huấn luyện cơ bản', 'Y tế thú y sơ cấp'],
        salary: 7200000,
        sub_role: 'WORKING_STAFF',
        account: {
            username: 'Phạm Văn Hùng',
            email: 'phamhung.working@petcafe.com',
            password_hash: '$2a$12$hash',
            role: 'EMPLOYEE',
            is_active: true,
            customer: null,
            employee: null,
            notifications: [],
            id: 'acc-ws-2',
            created_at: '2025-10-21T08:00:00+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-21T08:00:00+00:00',
            updated_by: null,
            is_deleted: false
        },
        team_members: [],
        orders: [],
        daily_schedules: [],
        created_at: '2025-10-21T08:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-21T08:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'emp-ws-3',
        account_id: 'acc-ws-3',
        full_name: 'Lê Thị Mai',
        avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
        email: 'lemai.working@petcafe.com',
        phone: '0945678901',
        address: '12 Đường Nguyễn Huệ, Quận 1, TP. HCM',
        skills: ['Pha chế', 'Phục vụ khách hàng', 'Vệ sinh quầy bar'],
        salary: 6900000,
        sub_role: 'WORKING_STAFF',
        account: {
            username: 'Lê Thị Mai',
            email: 'lemai.working@petcafe.com',
            password_hash: '$2a$12$hash',
            role: 'EMPLOYEE',
            is_active: true,
            customer: null,
            employee: null,
            notifications: [],
            id: 'acc-ws-3',
            created_at: '2025-10-22T08:00:00+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-22T08:00:00+00:00',
            updated_by: null,
            is_deleted: false
        },
        team_members: [],
        orders: [],
        daily_schedules: [],
        created_at: '2025-10-22T08:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-22T08:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'emp-sale-1',
        account_id: 'acc-sale-1',
        full_name: 'Trần Minh Tâm',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        email: 'tranminh tam.sales@petcafe.com',
        phone: '0956789012',
        address: '34 Đường Lý Tự Trọng, Quận 1, TP. HCM',
        skills: ['Tư vấn bán hàng', 'Quản lý kho', 'Marketing', 'Chăm sóc khách hàng'],
        salary: 7500000,
        sub_role: 'SALE_STAFF',
        account: {
            username: 'Trần Minh Tâm',
            email: 'tranminhtam.sales@petcafe.com',
            password_hash: '$2a$12$hash',
            role: 'EMPLOYEE',
            is_active: true,
            customer: null,
            employee: null,
            notifications: [],
            id: 'acc-sale-1',
            created_at: '2025-10-23T08:00:00+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-23T08:00:00+00:00',
            updated_by: null,
            is_deleted: false
        },
        team_members: [],
        orders: [],
        daily_schedules: [],
        created_at: '2025-10-23T08:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-23T08:00:00+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'emp-sale-2',
        account_id: 'acc-sale-2',
        full_name: 'Nguyễn Hoàng Nam',
        avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
        email: 'nguyenhoangnam.sales@petcafe.com',
        phone: '0967890123',
        address: '56 Đường Pasteur, Quận 1, TP. HCM',
        skills: ['Bán hàng trực tiếp', 'Thu ngân', 'Xử lý đơn hàng', 'Quảng bá sản phẩm'],
        salary: 7400000,
        sub_role: 'SALE_STAFF',
        account: {
            username: 'Nguyễn Hoàng Nam',
            email: 'nguyenhoangnam.sales@petcafe.com',
            password_hash: '$2a$12$hash',
            role: 'EMPLOYEE',
            is_active: true,
            customer: null,
            employee: null,
            notifications: [],
            id: 'acc-sale-2',
            created_at: '2025-10-24T08:00:00+00:00',
            created_by: '00000000-0000-0000-0000-000000000000',
            updated_at: '2025-10-24T08:00:00+00:00',
            updated_by: null,
            is_deleted: false
        },
        team_members: [],
        orders: [],
        daily_schedules: [],
        created_at: '2025-10-24T08:00:00+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-24T08:00:00+00:00',
        updated_by: null,
        is_deleted: false
    }
];

// Pets
export const MOCK_PETS = [
    // Nhóm: Mèo Cục Cưng Lông Dài
    {
        id: '1bd898d4-dd4a-4101-8e35-7b3fc40159e3',
        name: 'Milo',
        species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6', // mèo
        breed_id: '9e017f29-0eec-439d-a305-1b3dedc6c1bc', // Scottish Fold
        group_id: 'ca287dab-96a8-4922-86d5-1c2a99cc34ed', // Mèo Cục Cưng Lông Dài
        age: 2,
        gender: 'Male',
        color: 'Màu gừng (Ginger) và trắng',
        weight: 4.5,
        preferences: 'Thích đồ chơi lông vũ, thích được gãi tai và nằm cạnh cửa sổ.',
        special_notes: 'Đã triệt sản, hơi nhút nhát với người lạ nhưng sẽ trở nên rất quấn quýt khi làm quen.',
        image_url: 'https://firebasestorage.googleapis.com/v0/b/digital-dynamo-cb555.appspot.com/o/assets%2Fimages%2F76a30585-214d-4ade-aa38-b30490c54760.jpg?alt=media&token=9a92e6aa-b592-4fb4-a14f-d46ad5363962',
        arrival_date: '2024-05-10T10:00:00+00:00',
        species: null,
        breed: null,
        group: null,
        health_records: [],
        vaccination_records: [],
        vaccination_schedules: [],
        slots: [],
        created_at: '2025-10-27T06:22:17.710341+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:22:17.710342+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'aa11bb22-cc33-dd44-ee55-ff6677889900',
        name: 'Luna',
        species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6', // mèo
        breed_id: '9e017f29-0eec-439d-a305-1b3dedc6c1bc', // Scottish Fold
        group_id: 'ca287dab-96a8-4922-86d5-1c2a99cc34ed', // Mèo Cục Cưng Lông Dài
        age: 1,
        gender: 'Female',
        color: 'Xám bạc',
        weight: 3.8,
        preferences: 'Thích ngủ trong hộp giấy, thích ăn pate cá ngừ.',
        special_notes: 'Rất hiếu động, thích leo trèo.',
        image_url: 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=400',
        arrival_date: '2024-08-15T14:00:00+00:00',
        species: null,
        breed: null,
        group: null,
        health_records: [],
        vaccination_records: [],
        vaccination_schedules: [],
        slots: [],
        created_at: '2025-10-27T08:15:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T08:15:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'bb22cc33-dd44-ee55-ff66-778899001122',
        name: 'Oliver',
        species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6', // mèo
        breed_id: '9e017f29-0eec-439d-a305-1b3dedc6c1bc', // Scottish Fold
        group_id: 'ca287dab-96a8-4922-86d5-1c2a99cc34ed', // Mèo Cục Cưng Lông Dài
        age: 3,
        gender: 'Male',
        color: 'Trắng và đen',
        weight: 5.2,
        preferences: 'Thích chơi với bóng len, thích được chải lông.',
        special_notes: 'Cần chải lông hàng ngày để tránh búi lông.',
        image_url: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400',
        arrival_date: '2024-03-20T09:30:00+00:00',
        species: null,
        breed: null,
        group: null,
        health_records: [],
        vaccination_records: [],
        vaccination_schedules: [],
        slots: [],
        created_at: '2025-10-27T09:30:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T09:30:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },

    // Nhóm: Chó Nhỏ Năng Động
    {
        id: '72ab5c8f-cec6-42ce-87c7-6f6a55850c6a',
        name: 'Bella',
        species_id: '8d769794-167b-4458-a9a9-ac33748feee1', // chó
        breed_id: 'e717072a-f0ff-489f-a9d5-257fc3db9c9c', // Poodle Toy
        group_id: '7f0ede0f-a11a-47d2-a075-bc8500a4e321', // Chó Nhỏ Năng Động
        age: 5,
        gender: 'Female',
        color: 'Nâu đỏ sẫm',
        weight: 7.2,
        preferences: 'Thích các loại snack nhai cứng, thích đi dạo vào buổi sáng và chơi trò tìm kiếm.',
        special_notes: 'Đã được tiêm phòng đầy đủ, có tiền sử sợ tiếng pháo hoa/sấm sét.',
        image_url: 'https://firebasestorage.googleapis.com/v0/b/digital-dynamo-cb555.appspot.com/o/assets%2Fimages%2Fba38a8f6-f046-4755-873d-be01268bba6d.webp?alt=media&token=78611a01-a17d-4f7d-aa6b-b46e77ff99ea',
        arrival_date: '2023-11-20T15:30:00+00:00',
        species: null,
        breed: null,
        group: null,
        health_records: [],
        vaccination_records: [],
        vaccination_schedules: [],
        slots: [],
        created_at: '2025-10-27T06:25:50.639741+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T06:25:50.639741+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'cc33dd44-ee55-ff66-7788-99001122aabb',
        name: 'Max',
        species_id: '8d769794-167b-4458-a9a9-ac33748feee1', // chó
        breed_id: 'e717072a-f0ff-489f-a9d5-257fc3db9c9c', // Poodle Toy
        group_id: '7f0ede0f-a11a-47d2-a075-bc8500a4e321', // Chó Nhỏ Năng Động
        age: 2,
        gender: 'Male',
        color: 'Trắng xoăn',
        weight: 4.5,
        preferences: 'Thích chơi bóng, thích tắm và được chải lông.',
        special_notes: 'Rất thông minh, dễ huấn luyện.',
        image_url: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=400',
        arrival_date: '2024-06-10T11:00:00+00:00',
        species: null,
        breed: null,
        group: null,
        health_records: [],
        vaccination_records: [],
        vaccination_schedules: [],
        slots: [],
        created_at: '2025-10-27T10:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T10:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'dd44ee55-ff66-7788-9900-1122aabbccdd',
        name: 'Charlie',
        species_id: '8d769794-167b-4458-a9a9-ac33748feee1', // chó
        breed_id: 'e717072a-f0ff-489f-a9d5-257fc3db9c9c', // Poodle Toy
        group_id: '7f0ede0f-a11a-47d2-a075-bc8500a4e321', // Chó Nhỏ Năng Động
        age: 4,
        gender: 'Male',
        color: 'Nâu sữa',
        weight: 5.8,
        preferences: 'Thích chạy nhảy, thích chơi với chó khác.',
        special_notes: 'Rất năng động, cần vận động nhiều mỗi ngày.',
        image_url: 'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=400',
        arrival_date: '2024-01-15T10:00:00+00:00',
        species: null,
        breed: null,
        group: null,
        health_records: [],
        vaccination_records: [],
        vaccination_schedules: [],
        slots: [],
        created_at: '2025-10-27T11:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T11:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },

    // Nhóm: Mèo Lông Ngắn Năng Động
    {
        id: '11aa22bb-33cc-44dd-55ee-66ff77889900',
        name: 'Whiskers',
        species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6', // mèo
        breed_id: 'bb22cc33-dd44-ee55-ff66-778899002211', // British Shorthair
        group_id: 'db398ebc-a7b9-5a33-97e6-2d3ba0dd45fe', // Mèo Lông Ngắn Năng Động
        age: 2,
        gender: 'Male',
        color: 'Xám xanh',
        weight: 5.5,
        preferences: 'Thích chơi với đồ chơi chuột, thích được gãi cằm.',
        special_notes: 'Rất điềm tĩnh và độc lập.',
        image_url: 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=400',
        arrival_date: '2024-04-12T10:00:00+00:00',
        species: null,
        breed: null,
        group: null,
        health_records: [],
        vaccination_records: [],
        vaccination_schedules: [],
        slots: [],
        created_at: '2025-10-27T14:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T14:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '22bb33cc-44dd-55ee-66ff-778899001100',
        name: 'Mittens',
        species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6', // mèo
        breed_id: 'ee55ff66-7788-9900-1122-aabb44332211', // Siamese
        group_id: 'db398ebc-a7b9-5a33-97e6-2d3ba0dd45fe', // Mèo Lông Ngắn Năng Động
        age: 3,
        gender: 'Female',
        color: 'Seal point (nâu kem)',
        weight: 3.5,
        preferences: 'Rất năng động, thích chạy nhảy và leo trèo.',
        special_notes: 'Rất thông minh và hay kêu.',
        image_url: 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=400',
        arrival_date: '2024-02-28T09:00:00+00:00',
        species: null,
        breed: null,
        group: null,
        health_records: [],
        vaccination_records: [],
        vaccination_schedules: [],
        slots: [],
        created_at: '2025-10-27T15:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T15:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },

    // Nhóm: Mèo Ba Tư Quý Tộc
    {
        id: '33cc44dd-55ee-66ff-7788-990011223344',
        name: 'Princess',
        species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6', // mèo
        breed_id: 'aa11bb22-cc33-dd44-ee55-ff6677889901', // Persian
        group_id: '55667788-99aa-bbcc-ddee-ff0011223344', // Mèo Ba Tư Quý Tộc
        age: 4,
        gender: 'Female',
        color: 'Trắng kem',
        weight: 5.2,
        preferences: 'Thích được chải lông, thích nằm trên đệm mềm.',
        special_notes: 'Cần chải lông hàng ngày, mắt hay chảy nước.',
        image_url: 'https://images.unsplash.com/photo-1589883661923-6476cb0ae9f2?w=400',
        arrival_date: '2023-12-10T11:00:00+00:00',
        species: null,
        breed: null,
        group: null,
        health_records: [],
        vaccination_records: [],
        vaccination_schedules: [],
        slots: [],
        created_at: '2025-10-27T16:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T16:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '44dd55ee-66ff-7788-9900-112233445566',
        name: 'Fluffy',
        species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6', // mèo
        breed_id: 'aa11bb22-cc33-dd44-ee55-ff6677889901', // Persian
        group_id: '55667788-99aa-bbcc-ddee-ff0011223344', // Mèo Ba Tư Quý Tộc
        age: 2,
        gender: 'Male',
        color: 'Xám khói',
        weight: 4.8,
        preferences: 'Rất hiền lành, thích được ôm.',
        special_notes: 'Lông dễ rối, cần chăm sóc đặc biệt.',
        image_url: 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=400',
        arrival_date: '2024-07-15T14:00:00+00:00',
        species: null,
        breed: null,
        group: null,
        health_records: [],
        vaccination_records: [],
        vaccination_schedules: [],
        slots: [],
        created_at: '2025-10-27T17:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T17:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },

    // Thêm mèo Ragdoll và Maine Coon vào nhóm Mèo Cục Cưng Lông Dài
    {
        id: '55ee66ff-7788-9900-1122-334455667788',
        name: 'Raggy',
        species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6', // mèo
        breed_id: 'cc33dd44-ee55-ff66-7788-990033221100', // Ragdoll
        group_id: 'ca287dab-96a8-4922-86d5-1c2a99cc34ed', // Mèo Cục Cưng Lông Dài
        age: 3,
        gender: 'Female',
        color: 'Mitted seal',
        weight: 6.2,
        preferences: 'Rất thích được bế và ôm, rất hiền.',
        special_notes: 'Có xu hướng giãn cơ khi được bế.',
        image_url: 'https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=400',
        arrival_date: '2024-01-20T09:00:00+00:00',
        species: null,
        breed: null,
        group: null,
        health_records: [],
        vaccination_records: [],
        vaccination_schedules: [],
        slots: [],
        created_at: '2025-10-27T18:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T18:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '66ff7788-9900-1122-3344-556677889900',
        name: 'Maine',
        species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6', // mèo
        breed_id: 'dd44ee55-ff66-7788-9900-114422330011', // Maine Coon
        group_id: 'ca287dab-96a8-4922-86d5-1c2a99cc34ed', // Mèo Cục Cưng Lông Dài
        age: 5,
        gender: 'Male',
        color: 'Brown tabby',
        weight: 7.5,
        preferences: 'Thích chơi nước, thích leo cao.',
        special_notes: 'Rất lớn nhưng hiền lành, có tiếng kêu nhẹ nhàng.',
        image_url: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=400',
        arrival_date: '2023-08-05T10:30:00+00:00',
        species: null,
        breed: null,
        group: null,
        health_records: [],
        vaccination_records: [],
        vaccination_schedules: [],
        slots: [],
        created_at: '2025-10-27T19:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T19:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },

    // Nhóm: Chó Săn Cỡ Lớn Thân Thiện
    {
        id: '77889900-1122-3344-5566-778899aabbcc',
        name: 'Buddy',
        species_id: '8d769794-167b-4458-a9a9-ac33748feee1', // chó
        breed_id: 'ff667788-9900-1122-aabb-ccddeeff5544', // Golden Retriever
        group_id: '66778899-aabb-ccdd-eeff-001122334455', // Chó Săn Cỡ Lớn Thân Thiện
        age: 4,
        gender: 'Male',
        color: 'Vàng золотистый',
        weight: 32,
        preferences: 'Thích bơi lội, thích chơi bóng và đuổi theo.',
        special_notes: 'Rất thân thiện với trẻ em, dễ huấn luyện.',
        image_url: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=400',
        arrival_date: '2023-06-15T08:00:00+00:00',
        species: null,
        breed: null,
        group: null,
        health_records: [],
        vaccination_records: [],
        vaccination_schedules: [],
        slots: [],
        created_at: '2025-10-27T20:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T20:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '88990011-2233-4455-6677-8899aabbccdd',
        name: 'Lucy',
        species_id: '8d769794-167b-4458-a9a9-ac33748feee1', // chó
        breed_id: '11223344-5566-7788-99aa-bbccddee6655', // Labrador Retriever
        group_id: '66778899-aabb-ccdd-eeff-001122334455', // Chó Săn Cỡ Lớn Thân Thiện
        age: 3,
        gender: 'Female',
        color: 'Chocolate (nâu sô-cô-la)',
        weight: 28,
        preferences: 'Thích bơi, thích chơi đùa với chó khác.',
        special_notes: 'Rất năng động, cần vận động nhiều.',
        image_url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
        arrival_date: '2024-03-10T09:30:00+00:00',
        species: null,
        breed: null,
        group: null,
        health_records: [],
        vaccination_records: [],
        vaccination_schedules: [],
        slots: [],
        created_at: '2025-10-27T21:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T21:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },

    // Thêm Chihuahua vào nhóm Chó Nhỏ Năng Động
    {
        id: '99001122-3344-5566-7788-99aabbccddee',
        name: 'Tiny',
        species_id: '8d769794-167b-4458-a9a9-ac33748feee1', // chó
        breed_id: '22334455-6677-8899-aabb-ccddeeff7766', // Chihuahua
        group_id: '7f0ede0f-a11a-47d2-a075-bc8500a4e321', // Chó Nhỏ Năng Động
        age: 2,
        gender: 'Female',
        color: 'Nâu nhạt',
        weight: 2.2,
        preferences: 'Thích được ôm, sợ lạnh.',
        special_notes: 'Rất nhỏ, cần giữ ấm, hay run.',
        image_url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400',
        arrival_date: '2024-05-20T10:00:00+00:00',
        species: null,
        breed: null,
        group: null,
        health_records: [],
        vaccination_records: [],
        vaccination_schedules: [],
        slots: [],
        created_at: '2025-10-27T22:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T22:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },

    // Nhóm: Chó Nhật Bản Đặc Biệt
    {
        id: '00112233-4455-6677-8899-aabbccddeeff',
        name: 'Hachi',
        species_id: '8d769794-167b-4458-a9a9-ac33748feee1', // chó
        breed_id: '33445566-7788-99aa-bbcc-ddeeff008877', // Shiba Inu
        group_id: '77889900-aabb-ccdd-eeff-112233445566', // Chó Nhật Bản Đặc Biệt
        age: 3,
        gender: 'Male',
        color: 'Sesame (vàng đỏ)',
        weight: 10.5,
        preferences: 'Độc lập, thích khám phá.',
        special_notes: 'Cá tính mạnh, cần huấn luyện kiên nhẫn.',
        image_url: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=400',
        arrival_date: '2024-01-08T11:00:00+00:00',
        species: null,
        breed: null,
        group: null,
        health_records: [],
        vaccination_records: [],
        vaccination_schedules: [],
        slots: [],
        created_at: '2025-10-27T23:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T23:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '11223344-5566-7788-99aa-bbccddeeff00',
        name: 'Mochi',
        species_id: '8d769794-167b-4458-a9a9-ac33748feee1', // chó
        breed_id: '33445566-7788-99aa-bbcc-ddeeff008877', // Shiba Inu
        group_id: '77889900-aabb-ccdd-eeff-112233445566', // Chó Nhật Bản Đặc Biệt
        age: 2,
        gender: 'Female',
        color: 'Red (đỏ)',
        weight: 9.2,
        preferences: 'Thích chơi một mình, thích ngủ.',
        special_notes: 'Rất sạch sẽ, tự chải lông như mèo.',
        image_url: 'https://images.unsplash.com/photo-1568572933382-74d440642117?w=400',
        arrival_date: '2024-06-12T09:00:00+00:00',
        species: null,
        breed: null,
        group: null,
        health_records: [],
        vaccination_records: [],
        vaccination_schedules: [],
        slots: [],
        created_at: '2025-10-28T00:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T00:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },

    // Nhóm: Chó Chăn Cừu Hoạt Bát
    {
        id: '22334455-6677-8899-aabb-ccddeeff0011',
        name: 'Corgito',
        species_id: '8d769794-167b-4458-a9a9-ac33748feee1', // chó
        breed_id: '44556677-8899-aabb-ccdd-eeff11229988', // Corgi
        group_id: '88990011-bbcc-ddee-ff00-223344556677', // Chó Chăn Cừu Hoạt Bát
        age: 4,
        gender: 'Male',
        color: 'Tricolor (3 màu)',
        weight: 12.5,
        preferences: 'Rất năng động, thích chạy nhảy.',
        special_notes: 'Chân ngắn nhưng rất nhanh, hay sủa.',
        image_url: 'https://images.unsplash.com/photo-1612536764768-b7b26ae1a0d2?w=400',
        arrival_date: '2023-10-25T10:00:00+00:00',
        species: null,
        breed: null,
        group: null,
        health_records: [],
        vaccination_records: [],
        vaccination_schedules: [],
        slots: [],
        created_at: '2025-10-28T01:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T01:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '33445566-7788-99aa-bbcc-ddeeff001122',
        name: 'Ein',
        species_id: '8d769794-167b-4458-a9a9-ac33748feee1', // chó
        breed_id: '44556677-8899-aabb-ccdd-eeff11229988', // Corgi
        group_id: '88990011-bbcc-ddee-ff00-223344556677', // Chó Chăn Cừu Hoạt Bát
        age: 5,
        gender: 'Male',
        color: 'Red and white (đỏ trắng)',
        weight: 11.8,
        preferences: 'Thông minh, thích học tricks.',
        special_notes: 'Rất lanh lợi, dễ huấn luyện.',
        image_url: 'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=400',
        arrival_date: '2023-07-14T11:30:00+00:00',
        species: null,
        breed: null,
        group: null,
        health_records: [],
        vaccination_records: [],
        vaccination_schedules: [],
        slots: [],
        created_at: '2025-10-28T02:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T02:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },

    // Pets không thuộc nhóm nào
    {
        id: 'ee55ff66-7788-9900-1122-aabbccddeeff',
        name: 'Simba',
        species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6', // mèo
        breed_id: '9e017f29-0eec-439d-a305-1b3dedc6c1bc', // Scottish Fold
        group_id: null, // Chưa có nhóm
        age: 1,
        gender: 'Male',
        color: 'Vàng cam',
        weight: 3.2,
        preferences: 'Thích ngủ và ăn.',
        special_notes: 'Còn nhỏ, đang trong giai đoạn thích nghi.',
        image_url: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=400',
        arrival_date: '2024-09-01T08:00:00+00:00',
        species: null,
        breed: null,
        group: null,
        health_records: [],
        vaccination_records: [],
        vaccination_schedules: [],
        slots: [],
        created_at: '2025-10-27T12:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T12:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: 'ff667788-9900-1122-aabb-ccddeeff0011',
        name: 'Rocky',
        species_id: '8d769794-167b-4458-a9a9-ac33748feee1', // chó
        breed_id: 'e717072a-f0ff-489f-a9d5-257fc3db9c9c', // Poodle Toy
        group_id: null, // Chưa có nhóm
        age: 6,
        gender: 'Male',
        color: 'Đen',
        weight: 6.5,
        preferences: 'Thích được vuốt ve, thích ăn thịt.',
        special_notes: 'Đã già, cần chăm sóc đặc biệt.',
        image_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
        arrival_date: '2023-05-20T07:00:00+00:00',
        species: null,
        breed: null,
        group: null,
        health_records: [],
        vaccination_records: [],
        vaccination_schedules: [],
        slots: [],
        created_at: '2025-10-27T13:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-27T13:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    },
    {
        id: '44556677-8899-aabb-ccdd-eeff11223300',
        name: 'Shadow',
        species_id: 'b6988687-c027-4b63-b91f-e8652c7a54c6', // mèo
        breed_id: 'ee55ff66-7788-9900-1122-aabb44332211', // Siamese
        group_id: null,
        age: 2,
        gender: 'Male',
        color: 'Blue point',
        weight: 3.8,
        preferences: 'Rất năng động và thích nói chuyện.',
        special_notes: 'Đang chờ được xếp nhóm.',
        image_url: 'https://images.unsplash.com/photo-1573865526739-10c1de0a4b59?w=400',
        arrival_date: '2024-08-20T09:00:00+00:00',
        species: null,
        breed: null,
        group: null,
        health_records: [],
        vaccination_records: [],
        vaccination_schedules: [],
        slots: [],
        created_at: '2025-10-28T03:00:00.000000+00:00',
        created_by: '00000000-0000-0000-0000-000000000000',
        updated_at: '2025-10-28T03:00:00.000000+00:00',
        updated_by: null,
        is_deleted: false
    }
];

export default {
    MOCK_WORK_TYPES,
    MOCK_PET_SPECIES,
    MOCK_PET_BREEDS,
    MOCK_PET_GROUPS,
    MOCK_PETS,
    MOCK_AREAS,
    MOCK_TEAMS,
    MOCK_EMPLOYEES,
    MOCK_SERVICES
};

