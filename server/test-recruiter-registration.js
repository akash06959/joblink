const axios = require('axios');

const testRecruiterRegistration = async () => {
    const timestamp = Date.now();
    const testData = {
        name: 'Test Recruiter',
        email: `recruiter_test_${timestamp}@example.com`,
        password: 'TestPassword123!',
        role: 'Recruiter',
        headline: 'Senior HR Manager',
        location: 'New York, USA',
        companyName: 'Test Company Inc.'
    };

    console.log('Testing recruiter registration with data:', testData);

    try {
        const response = await axios.post('http://localhost:5000/api/auth/register', testData);
        console.log('\n✓ Registration successful!');
        console.log('Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('\n✗ Registration failed!');
        if (error.response) {
            console.error('Error status:', error.response.status);
            console.error('Error message:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
        throw error;
    }
};

testRecruiterRegistration()
    .then(() => {
        console.log('\n✓ Test completed successfully!');
        process.exit(0);
    })
    .catch(() => {
        console.log('\n✗ Test failed!');
        process.exit(1);
    });
