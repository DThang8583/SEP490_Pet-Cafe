import axios from 'axios';

// Base configuration
const API_BASE_URL = 'http://localhost:8080/api';

// ========== MOCK PET DATA ==========
// Pet Species
const MOCK_PET_SPECIES = [
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

// Helper functions for nested data (must be after MOCK_PET_SPECIES and MOCK_PET_BREEDS)
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

const createNestedBreedData = (breedId) => {
    const breed = MOCK_PET_BREEDS.find(b => b.id === breedId);
    if (!breed) return null;
    return {
        ...breed,
        species: null,
        pets: []
    };
};

// Pet Breeds
const MOCK_PET_BREEDS = [
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

// Pet Groups
const MOCK_PET_GROUPS = [
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

// Mock Pets Database
let MOCK_PETS = [
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

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = () => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
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
        'customer': [],
        'working_staff': ['pet_view_all', 'pet_management'],
        'manager': ['pet_view_all', 'pet_management'],
        'admin': ['full_access']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission) || userPermissions.includes('full_access');
};

// ==========  PET API ==========

/**
 * Get all pets (match official API structure)
 * @returns {Promise<Object>} { success: boolean, data: Array, pagination: Object }
 */
const getPets = async (params = {}) => {
    await delay(300);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'pet_view_all')) {
        throw new Error('Không có quyền xem danh sách thú cưng');
    }

    const {
        page_index = 0,
        page_size = 10,
        search = '',
        species_id = null,
        breed_id = null,
        group_id = null
    } = params;

    let pets = [...MOCK_PETS].filter(p => !p.is_deleted);

    // Filter by search
    if (search) {
        const searchLower = search.toLowerCase();
        pets = pets.filter(p =>
            p.name.toLowerCase().includes(searchLower) ||
            p.color?.toLowerCase().includes(searchLower)
        );
    }

    // Filter by species
    if (species_id) {
        pets = pets.filter(p => p.species_id === species_id);
    }

    // Filter by breed
    if (breed_id) {
        pets = pets.filter(p => p.breed_id === breed_id);
    }

    // Filter by group
    if (group_id) {
        pets = pets.filter(p => p.group_id === group_id);
    }

    const total_items_count = pets.length;
    const total_pages_count = Math.ceil(total_items_count / page_size);
    const start = page_index * page_size;
    const paginatedPets = pets.slice(start, start + page_size);

    // Populate nested objects for list view
    const petsWithNestedData = paginatedPets.map(pet => ({
        ...pet,
        species: pet.species_id ? MOCK_PET_SPECIES.find(s => s.id === pet.species_id) || null : null,
        breed: pet.breed_id ? MOCK_PET_BREEDS.find(b => b.id === pet.breed_id) || null : null,
        group: pet.group_id ? MOCK_PET_GROUPS.find(g => g.id === pet.group_id) || null : null
    }));

    return {
        success: true,
        data: petsWithNestedData,
        pagination: {
            total_items_count,
            page_size,
            total_pages_count,
            page_index,
            has_next: page_index < total_pages_count - 1,
            has_previous: page_index > 0
        }
    };
};

/**
 * Get pet by ID
 * @param {string} petId
 * @returns {Promise<Object>}
 */
const getPetById = async (petId) => {
    await delay(200);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'pet_view_all')) {
        throw new Error('Không có quyền xem thông tin thú cưng');
    }

    const pet = MOCK_PETS.find(p => p.id === petId && !p.is_deleted);

    if (!pet) {
        throw new Error('Không tìm thấy thú cưng');
    }

    return {
        success: true,
        data: pet
    };
};

/**
 * Add new pet (group_id is NOT allowed in create API)
 * @param {Object} petData - { name, age, species_id, breed_id, color, weight, preferences, special_notes, image_url, arrival_date, gender }
 * @returns {Promise<Object>}
 */
const addPet = async (petData) => {
    await delay(500);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'pet_management')) {
        throw new Error('Không có quyền thêm thú cưng');
    }

    const newPet = {
        id: generateId(),
        name: petData.name,
        age: petData.age,
        species_id: petData.species_id,
        breed_id: petData.breed_id,
        color: petData.color,
        weight: petData.weight,
        preferences: petData.preferences || '',
        special_notes: petData.special_notes || '',
        image_url: petData.image_url || '',
        arrival_date: petData.arrival_date || new Date().toISOString(),
        gender: petData.gender,
        // group_id is NOT in create API - will be null
        group_id: null,
        // Nested objects are null (match API)
        species: null,
        breed: null,
        group: null,
        health_records: [],
        vaccination_records: [],
        vaccination_schedules: [],
        slots: [],
        created_at: new Date().toISOString(),
        created_by: currentUser?.id || '00000000-0000-0000-0000-000000000000',
        updated_at: new Date().toISOString(),
        updated_by: null,
        is_deleted: false
    };

    MOCK_PETS.push(newPet);

    return {
        success: true,
        data: newPet,
        message: 'Thêm thú cưng thành công'
    };
};

/**
 * Update pet (group_id is allowed in edit API)
 * @param {string} petId
 * @param {Object} updates - { name, age, species_id, breed_id, color, weight, preferences, special_notes, image_url, arrival_date, gender, group_id }
 * @returns {Promise<Object>}
 */
const updatePet = async (petId, updates) => {
    await delay(400);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'pet_management')) {
        throw new Error('Không có quyền cập nhật thú cưng');
    }

    const petIndex = MOCK_PETS.findIndex(p => p.id === petId && !p.is_deleted);

    if (petIndex === -1) {
        throw new Error('Không tìm thấy thú cưng');
    }

    const updatedPet = {
        ...MOCK_PETS[petIndex],
        ...updates,
        // Handle group_id update (can be set/changed in edit)
        group_id: updates.group_id !== undefined ? (updates.group_id || null) : MOCK_PETS[petIndex].group_id,
        updated_at: new Date().toISOString(),
        updated_by: currentUser?.id || '00000000-0000-0000-0000-000000000000',
        // Keep nested objects as null (match API)
        species: null,
        breed: null,
        group: null
    };

    MOCK_PETS[petIndex] = updatedPet;

    return {
        success: true,
        data: updatedPet,
        message: 'Cập nhật thú cưng thành công'
    };
};

/**
 * Delete pet (soft delete)
 * @param {string} petId
 * @returns {Promise<Object>}
 */
const deletePet = async (petId) => {
    await delay(400);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'pet_management')) {
        throw new Error('Không có quyền xóa thú cưng');
    }

    const petIndex = MOCK_PETS.findIndex(p => p.id === petId && !p.is_deleted);

    if (petIndex === -1) {
        throw new Error('Không tìm thấy thú cưng');
    }

    MOCK_PETS[petIndex].is_deleted = true;
    MOCK_PETS[petIndex].updated_at = new Date().toISOString();
    MOCK_PETS[petIndex].updated_by = currentUser?.id || '00000000-0000-0000-0000-000000000000';

    return {
        success: true,
        message: 'Xóa thú cưng thành công'
    };
};

// ========== PET SPECIES API ==========

/**
 * Get all pet species (Loài)
 * @returns {Promise<Object>}
 */
const getPetSpecies = async () => {
    await delay(200);

    return {
        success: true,
        data: MOCK_PET_SPECIES.filter(s => !s.is_deleted),
        pagination: {
            total_items_count: MOCK_PET_SPECIES.length,
            page_size: 10,
            total_pages_count: 1,
            page_index: 0,
            has_next: false,
            has_previous: false
        }
    };
};

// ========== PET BREEDS API ==========

/**
 * Get all pet breeds (Giống) - List view populates species for UI
 * @param {string} speciesId - Optional filter by species
 * @returns {Promise<Object>}
 */
const getPetBreeds = async (speciesId = null) => {
    await delay(200);

    let breeds = [...MOCK_PET_BREEDS].filter(b => !b.is_deleted);

    if (speciesId) {
        breeds = breeds.filter(b => b.species_id === speciesId);
    }

    // Populate species for list view (detail view has species = null)
    const breedsWithSpecies = breeds.map(breed => ({
        ...breed,
        species: breed.species_id ? MOCK_PET_SPECIES.find(s => s.id === breed.species_id) || null : null
    }));

    return {
        success: true,
        data: breedsWithSpecies,
        pagination: {
            total_items_count: breeds.length,
            page_size: 10,
            total_pages_count: 1,
            page_index: 0,
            has_next: false,
            has_previous: false
        }
    };
};

/**
 * Create pet breed (species is null in API response)
 * @param {Object} breedData - { name, species_id, description, average_weight, average_lifespan }
 * @returns {Promise<Object>}
 */
const createPetBreed = async (breedData) => {
    await delay(400);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'pet_management')) {
        throw new Error('Không có quyền tạo giống');
    }

    const newBreed = {
        id: generateId(),
        name: breedData.name,
        species_id: breedData.species_id,
        description: breedData.description || '',
        average_weight: breedData.average_weight,
        average_lifespan: breedData.average_lifespan,
        species: null, // Match API: species is null in detail response
        pets: [],
        created_at: new Date().toISOString(),
        created_by: currentUser?.id || '00000000-0000-0000-0000-000000000000',
        updated_at: new Date().toISOString(),
        updated_by: null,
        is_deleted: false
    };

    MOCK_PET_BREEDS.push(newBreed);

    return {
        success: true,
        data: newBreed,
        message: 'Tạo giống thành công'
    };
};

/**
 * Update pet breed (species is null in API response)
 * @param {string} breedId
 * @param {Object} updates - { name, species_id, description, average_weight, average_lifespan }
 * @returns {Promise<Object>}
 */
const updatePetBreed = async (breedId, updates) => {
    await delay(400);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'pet_management')) {
        throw new Error('Không có quyền cập nhật giống');
    }

    const breedIndex = MOCK_PET_BREEDS.findIndex(b => b.id === breedId && !b.is_deleted);

    if (breedIndex === -1) {
        throw new Error('Không tìm thấy giống');
    }

    const updatedBreed = {
        ...MOCK_PET_BREEDS[breedIndex],
        ...updates,
        species: null, // Match API: species is null in detail response
        updated_at: new Date().toISOString(),
        updated_by: currentUser?.id || '00000000-0000-0000-0000-000000000000'
    };

    MOCK_PET_BREEDS[breedIndex] = updatedBreed;

    return {
        success: true,
        data: updatedBreed,
        message: 'Cập nhật giống thành công'
    };
};

/**
 * Delete pet breed
 * @param {string} breedId
 * @returns {Promise<Object>}
 */
const deletePetBreed = async (breedId) => {
    await delay(400);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'pet_management')) {
        throw new Error('Không có quyền xóa giống');
    }

    const breedIndex = MOCK_PET_BREEDS.findIndex(b => b.id === breedId && !b.is_deleted);

    if (breedIndex === -1) {
        throw new Error('Không tìm thấy giống');
    }

    MOCK_PET_BREEDS[breedIndex].is_deleted = true;
    MOCK_PET_BREEDS[breedIndex].updated_at = new Date().toISOString();
    MOCK_PET_BREEDS[breedIndex].updated_by = currentUser?.id || '00000000-0000-0000-0000-000000000000';

    return {
        success: true,
        message: 'Xóa giống thành công'
    };
};

// ========== PET GROUPS API ==========

/**
 * Get all pet groups (Nhóm Pet) - List view populates nested objects for UI
 * @returns {Promise<Object>}
 */
const getPetGroups = async () => {
    await delay(200);

    const groups = MOCK_PET_GROUPS.filter(g => !g.is_deleted);

    // Populate nested objects for list view
    const groupsWithNested = groups.map(group => ({
        ...group,
        pet_species: group.pet_species_id ? MOCK_PET_SPECIES.find(s => s.id === group.pet_species_id) || null : null,
        pet_breed: group.pet_breed_id ? MOCK_PET_BREEDS.find(b => b.id === group.pet_breed_id) || null : null
    }));

    return {
        success: true,
        data: groupsWithNested,
        pagination: {
            total_items_count: groups.length,
            page_size: 10,
            total_pages_count: 1,
            page_index: 0,
            has_next: false,
            has_previous: false
        }
    };
};

/**
 * Create pet group (nested objects ARE populated in API response, unlike Pet/Breed)
 * @param {Object} groupData - { name, description, pet_species_id, pet_breed_id }
 * @returns {Promise<Object>}
 */
const createPetGroup = async (groupData) => {
    await delay(400);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'pet_management')) {
        throw new Error('Không có quyền tạo nhóm');
    }

    // Get nested species object
    const species = MOCK_PET_SPECIES.find(s => s.id === groupData.pet_species_id);
    const breed = groupData.pet_breed_id ? MOCK_PET_BREEDS.find(b => b.id === groupData.pet_breed_id) : null;

    const newGroup = {
        id: generateId(),
        name: groupData.name,
        description: groupData.description || '',
        pet_species_id: groupData.pet_species_id,
        pet_species: species ? {
            ...species,
            pet_breeds: [],
            pets: [],
            vaccine_types: []
        } : null,
        pet_breed_id: groupData.pet_breed_id,
        pet_breed: breed ? {
            ...breed,
            species: null,
            pets: []
        } : null,
        pets: [],
        slots: [],
        created_at: new Date().toISOString(),
        created_by: currentUser?.id || '00000000-0000-0000-0000-000000000000',
        updated_at: new Date().toISOString(),
        updated_by: null,
        is_deleted: false
    };

    MOCK_PET_GROUPS.push(newGroup);

    return {
        success: true,
        data: newGroup,
        message: 'Tạo nhóm thành công'
    };
};

/**
 * Update pet group (nested objects ARE populated in API response, unlike Pet/Breed)
 * @param {string} groupId
 * @param {Object} updates - { name, description, pet_species_id, pet_breed_id }
 * @returns {Promise<Object>}
 */
const updatePetGroup = async (groupId, updates) => {
    await delay(400);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'pet_management')) {
        throw new Error('Không có quyền cập nhật nhóm');
    }

    const groupIndex = MOCK_PET_GROUPS.findIndex(g => g.id === groupId && !g.is_deleted);

    if (groupIndex === -1) {
        throw new Error('Không tìm thấy nhóm');
    }

    const updatedGroup = {
        ...MOCK_PET_GROUPS[groupIndex],
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: currentUser?.id || '00000000-0000-0000-0000-000000000000'
    };

    // Update nested objects if IDs changed
    if (updates.pet_species_id !== undefined) {
        const species = MOCK_PET_SPECIES.find(s => s.id === updates.pet_species_id);
        updatedGroup.pet_species = species ? {
            ...species,
            pet_breeds: [],
            pets: [],
            vaccine_types: []
        } : null;
    }
    if (updates.pet_breed_id !== undefined) {
        const breed = updates.pet_breed_id ? MOCK_PET_BREEDS.find(b => b.id === updates.pet_breed_id) : null;
        updatedGroup.pet_breed = breed ? {
            ...breed,
            species: null,
            pets: []
        } : null;
    }

    MOCK_PET_GROUPS[groupIndex] = updatedGroup;

    return {
        success: true,
        data: updatedGroup,
        message: 'Cập nhật nhóm thành công'
    };
};

/**
 * Delete pet group
 * @param {string} groupId
 * @returns {Promise<Object>}
 */
const deletePetGroup = async (groupId) => {
    await delay(400);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'pet_management')) {
        throw new Error('Không có quyền xóa nhóm');
    }

    const groupIndex = MOCK_PET_GROUPS.findIndex(g => g.id === groupId && !g.is_deleted);

    if (groupIndex === -1) {
        throw new Error('Không tìm thấy nhóm');
    }

    MOCK_PET_GROUPS[groupIndex].is_deleted = true;
    MOCK_PET_GROUPS[groupIndex].updated_at = new Date().toISOString();
    MOCK_PET_GROUPS[groupIndex].updated_by = currentUser?.id || '00000000-0000-0000-0000-000000000000';

    return {
        success: true,
        message: 'Xóa nhóm thành công'
    };
};

// Export API
export const petApi = {
    // Pets
    getPets,
    getMyPets: getPets,  // Alias for backward compatibility
    getPetById,
    addPet,
    updatePet,
    deletePet,
    // Species
    getPetSpecies,
    // Breeds
    getPetBreeds,
    createPetBreed,
    updatePetBreed,
    deletePetBreed,
    // Groups
    getPetGroups,
    createPetGroup,
    updatePetGroup,
    deletePetGroup
};

export default petApi;
export { MOCK_PET_SPECIES, MOCK_PET_BREEDS, MOCK_PET_GROUPS, MOCK_PETS };
