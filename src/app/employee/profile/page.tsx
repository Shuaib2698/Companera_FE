'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Layout from '@/app/components/Layout';

interface BankDetail {
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  branchName: string;
  branchAddress: string;
  ifscCode: string;
  accountType: string;
  isPrimary: boolean;
  isVerified: boolean;
  verificationDate?: Date;
  verifiedBy?: string;
}

interface Documents {
  idProof?: string;
  addressProof?: string;
  educationCertificates?: string;
  experienceCertificates?: string;
  photograph?: string;
  offerLetter?: string;
  joiningLetter?: string;
  salarySlip?: string;
  resume?: string;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('personal');
  const [profile, setProfile] = useState({
    personalInfo: {
      firstName: '',
      lastName: '',
      gender: '',
      dateOfBirth: '',
      phone: '',
      imageUrl: '',
      maritalStatus: '',
      nationality: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      address: '',
      city: '',
      state: '',
      zipCode: ''
    },
    professionalInfo: {
      designation: '',
      department: '',
      dateOfJoining: '',
      linkedinUrl: '',
      employeeType: '',
      workMode: '',
      workType: '',
      workingDays: [] as number[],
      shiftStart: '',
      shiftEnd: ''
    },
    accountAccess: {
      slackId: '',
      skypeId: '',
      githubId: ''
    },
    bankDetails: [] as BankDetail[],
    documents: {} as Documents
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/me');
        setProfile(res.data);
        if (res.data.personalInfo?.imageUrl) {
          setImagePreview(res.data.personalInfo.imageUrl);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error fetching profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let updateData = {};
      
      if (activeTab === 'personal') {
        updateData = { personalInfo: profile.personalInfo };
      } else if (activeTab === 'professional') {
        updateData = { professionalInfo: profile.professionalInfo };
      } else if (activeTab === 'bank') {
        updateData = { bankDetails: profile.bankDetails };
      } else if (activeTab === 'account') {
        updateData = { accountAccess: profile.accountAccess };
      } else if (activeTab === 'documents') {
        updateData = { documents: profile.documents };
      }

      await api.put('/users/profile', updateData);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error updating profile');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, section: keyof typeof profile, field: string) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: e.target.value
      }
    }));
  };

  const handleBankInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number, field: keyof BankDetail) => {
  const updatedBankDetails = [...profile.bankDetails];
  updatedBankDetails[index] = {
    ...updatedBankDetails[index],
    [field]: e.target.value
  };
  setProfile(prev => ({
    ...prev,
    bankDetails: updatedBankDetails
  }));
};

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('image', file);

      try {
        const res = await api.post('/users/upload-profile-picture', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        setProfile(prev => ({
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            imageUrl: res.data.imageUrl
          }
        }));
        setImagePreview(URL.createObjectURL(file));
        setSuccess('Profile picture updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error uploading image');
      }
    }
  };

  if (loading) return <Layout allowedRoles={['employee', 'admin']}>Loading...</Layout>;

  return (
    <Layout allowedRoles={['employee', 'admin']}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {/* Sub-Navbar */}
        <div className="bg-white shadow-sm mb-6">
          <nav className="flex overflow-x-auto">
            <div className="flex space-x-1 px-4">
              <button
                onClick={() => setActiveTab('personal')}
                className={`px-4 py-3 rounded-md whitespace-nowrap ${activeTab === 'personal' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Personal Information
              </button>
              <button
                onClick={() => setActiveTab('professional')}
                className={`px-4 py-3 rounded-md whitespace-nowrap ${activeTab === 'professional' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Professional Information
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-3 rounded-md whitespace-nowrap ${activeTab === 'documents' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Documents
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`px-4 py-3 rounded-md whitespace-nowrap ${activeTab === 'account' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Account Access
              </button>
              <button
                onClick={() => setActiveTab('bank')}
                className={`px-4 py-3 rounded-md whitespace-nowrap ${activeTab === 'bank' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Bank Information
              </button>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="bg-white p-6 rounded-lg shadow">
          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Personal Information</h2>
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <img
                        className="h-24 w-24 rounded-full object-cover"
                        src={imagePreview || '/placeholder-user.jpg'}
                        alt="Profile"
                      />
                      <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                      </label>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">
                      {profile.personalInfo.firstName} {profile.personalInfo.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">Employee</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={profile.personalInfo.firstName}
                      onChange={(e) => handleInputChange(e, 'personalInfo', 'firstName')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={profile.personalInfo.lastName}
                      onChange={(e) => handleInputChange(e, 'personalInfo', 'lastName')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={profile.personalInfo.gender}
                      onChange={(e) => handleInputChange(e, 'personalInfo', 'gender')}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="NA">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={profile.personalInfo.dateOfBirth?.split('T')[0] || ''}
                      onChange={(e) => handleInputChange(e, 'personalInfo', 'dateOfBirth')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={profile.personalInfo.phone}
                      onChange={(e) => handleInputChange(e, 'personalInfo', 'phone')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={profile.personalInfo.emergencyContactName}
                      onChange={(e) => handleInputChange(e, 'personalInfo', 'emergencyContactName')}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={profile.personalInfo.address}
                    onChange={(e) => handleInputChange(e, 'personalInfo', 'address')}
                  />
                </div>
              </div>
            )}

            {activeTab === 'professional' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Professional Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={profile.professionalInfo.designation}
                      onChange={(e) => handleInputChange(e, 'professionalInfo', 'designation')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={profile.professionalInfo.department}
                      onChange={(e) => handleInputChange(e, 'professionalInfo', 'department')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={profile.professionalInfo.dateOfJoining?.split('T')[0] || ''}
                      onChange={(e) => handleInputChange(e, 'professionalInfo', 'dateOfJoining')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee Type</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={profile.professionalInfo.employeeType}
                      onChange={(e) => handleInputChange(e, 'professionalInfo', 'employeeType')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile</label>
                    <input
                      type="url"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={profile.professionalInfo.linkedinUrl}
                      onChange={(e) => handleInputChange(e, 'professionalInfo', 'linkedinUrl')}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Account Access</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slack ID</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={profile.accountAccess.slackId}
                      onChange={(e) => handleInputChange(e, 'accountAccess', 'slackId')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Skype ID</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={profile.accountAccess.skypeId}
                      onChange={(e) => handleInputChange(e, 'accountAccess', 'skypeId')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GitHub ID</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={profile.accountAccess.githubId}
                      onChange={(e) => handleInputChange(e, 'accountAccess', 'githubId')}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bank' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Bank Information</h2>
                {profile.bankDetails.map((bank, index) => (
                  <div key={index} className="border p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={bank.accountHolderName}
                          onChange={(e) => handleBankInputChange(e, index, 'accountHolderName')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={bank.accountNumber}
                          onChange={(e) => handleBankInputChange(e, index, 'accountNumber')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={bank.bankName}
                          onChange={(e) => handleBankInputChange(e, index, 'bankName')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={bank.branchName}
                          onChange={(e) => handleBankInputChange(e, index, 'branchName')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={bank.ifscCode}
                          onChange={(e) => handleBankInputChange(e, index, 'ifscCode')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={bank.accountType}
                          onChange={(e) => handleBankInputChange(e, index, 'accountType')}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
  type="button"
  onClick={() => setProfile(prev => ({
    ...prev,
    bankDetails: [...prev.bankDetails, {
      accountHolderName: '',
      accountNumber: '',
      bankName: '',
      branchName: '',
      branchAddress: '',
      ifscCode: '',
      accountType: '',
      isPrimary: false,
      isVerified: false,
      verificationDate: undefined,
      verifiedBy: undefined
    }]
  }))}
  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
>
  Add Bank Account
</button>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Documents</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={profile.documents?.idProof || ''}
                      onChange={(e) => handleInputChange(e, 'documents', 'idProof')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Proof</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={profile.documents?.addressProof || ''}
                      onChange={(e) => handleInputChange(e, 'documents', 'addressProof')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Education Certificates</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={profile.documents?.educationCertificates || ''}
                      onChange={(e) => handleInputChange(e, 'documents', 'educationCertificates')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Experience Certificates</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={profile.documents?.experienceCertificates || ''}
                      onChange={(e) => handleInputChange(e, 'documents', 'experienceCertificates')}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Update Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}