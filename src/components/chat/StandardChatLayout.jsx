// import { useState, useCallback, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useLocation } from 'react-router-dom';
// import { useSocket } from '../../hooks/useSocket';
// import { useTheme } from '../../hooks/useTheme';
// import RoomList from './RoomList';
// import ChatWindow from './ChatWindow';
// import {
//   Modal,
//   Input,
//   Avatar,
//   message,
//   Spin,
//   Button,
//   Empty,
//   Badge,
//   Typography,
//   Switch,
// } from 'antd';
// import {
//   SearchOutlined,
//   MailOutlined,
//   CloseOutlined,
//   UserAddOutlined,
//   MessageOutlined,
//   CheckCircleOutlined,
//   ArrowLeftOutlined,
//   PhoneOutlined,
// } from '@ant-design/icons';
// import {
//   createDirectRoom,
//   createAdminChat,
//   setActiveRoom,
//   fetchRooms,
//   fetchAvailableUsers,
// } from '../../redux/slices/chatSlice';

// const { Text } = Typography;

// export default function StandardChatLayout() {
//   const { theme } = useTheme();
//   const dispatch = useDispatch();
//   const location = useLocation();
//   const { user } = useSelector((s) => s.auth);
//   const { activeRoomId } = useSelector((s) => s.chat);

//   const [showModal, setShowModal] = useState(false);
//   const [creatingRoom, setCreatingRoom] = useState(false);
//   const [availableUsers, setAvailableUsers] = useState([]);
//   const [loadingUsers, setLoadingUsers] = useState(false);
//   const [searchUserTerm, setSearchUserTerm] = useState('');
//   const [chatOpened, setChatOpened] = useState(false);

//   useSocket();

//   // Check if we should open chat from navigation state
//   useEffect(() => {
//     if (location.state?.openChat && activeRoomId) {
//       setChatOpened(true);
//     }
//   }, [location.state, activeRoomId]);

//   const handlePlusClick = async () => {
//     setShowModal(true);
//     setSearchUserTerm('');
//     setLoadingUsers(true);
    
//     try {
//       const result = await dispatch(fetchAvailableUsers({ contactsOnly: true })).unwrap();
//       setAvailableUsers(result?.data?.users || result?.users || []);
//     } catch (error) {
//       message.error('Failed to load contacts');
//     } finally {
//       setLoadingUsers(false);
//     }
//   };

//   const handleCreateRoom = async (selectedUser) => {
//     try {
//       setCreatingRoom(true);
//       const currentUserIsAdmin = ['ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN'].includes(user?.role);
//       const selectedUserIsAdmin = ['ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN'].includes(selectedUser.role);
//       const isAdminChat = currentUserIsAdmin && selectedUserIsAdmin;

//       const result = isAdminChat
//         ? await dispatch(createAdminChat({ adminId: selectedUser._id })).unwrap()
//         : await dispatch(createDirectRoom({ userId: selectedUser._id })).unwrap();

//       const roomId = result?.data?.room?._id || result?.room?._id || result?._id;

//       if (roomId) {
//         dispatch(setActiveRoom(roomId));
//         dispatch(fetchRooms());
//         setChatOpened(true);
//         message.success('Chat opened successfully');
//       }
//       setShowModal(false);
//     } catch (error) {
//       message.error('Failed to create chat');
//     } finally {
//       setCreatingRoom(false);
//     }
//   };

//   const filteredUsers = availableUsers.filter(
//     (user) =>
//       user.name?.toLowerCase().includes(searchUserTerm.toLowerCase()) ||
//       user.email?.toLowerCase().includes(searchUserTerm.toLowerCase())
//   );

//   const getRoleBadgeColor = useCallback((role) => {
//     switch (role) {
//       case 'ADMIN':
//       case 'TENANT_ADMIN':
//         return '#EF4444';
//       case 'SUPER_ADMIN':
//         return '#8B5CF6';
//       case 'USER':
//         return '#00A884';
//       default:
//         return '#9CA3AF';
//     }
//   }, []);

//   const getRoleDisplayName = useCallback((role) => {
//     const roleMap = {
//       'ADMIN': 'Admin',
//       'TENANT_ADMIN': 'Tenant Admin',
//       'SUPER_ADMIN': 'Super Admin',
//       'USER': 'User',
//     };
//     return roleMap[role] || role;
//   }, []);

//   const primaryColor = theme?.primaryColor || '#008069';

//   // Mobile: Show room list or chat based on chatOpened state
//   if (window.innerWidth < 768) {
//     if (chatOpened && activeRoomId) {
//       return (
//         <>
//           <style>{`
//             body { overflow: hidden !important; }
//             nav[class*="bottom-0"] { display: none !important; }
//           `}</style>
//           <div className="fixed inset-0 flex flex-col z-[150]" style={{ backgroundColor: theme?.backgroundColor || '#FFFFFF', overflow: 'hidden' }}>
//             <ChatWindow 
//               showMobileHeader={true}
//               onBack={() => {
//                 dispatch(setActiveRoom(''));
//                 setTimeout(() => setChatOpened(false), 0);
//               }}
//             />
//           </div>
//         </>
//       );
//     }
    
//     // Show room list when chat is not opened
//     return (
//       <>
//         <style>{`body { overflow: hidden !important; }`}</style>
//         <div className="fixed top-0 left-0 right-0 bottom-14 flex flex-col z-10" style={{ backgroundColor: theme?.backgroundColor || '#F0F2F5', overflow: 'hidden' }}>
//           <div className="flex-1 overflow-hidden">
//             <RoomList onCreateRoom={handlePlusClick} onRoomClick={() => setChatOpened(true)} />
//           </div>
//         </div>

//         <Modal
//           title={
//             <div className="flex items-center gap-3">
//               <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
//                 <UserAddOutlined style={{ color: primaryColor, fontSize: '18px' }} />
//               </div>
//               <span style={{ fontSize: '16px', fontWeight: 600 }}>My Contacts</span>
//             </div>
//           }
//           open={showModal}
//           onCancel={() => setShowModal(false)}
//           footer={null}
//           width={500}
//           centered
//         >
//           <div className="mb-4">
//             <Input
//               placeholder="Search by name or email..."
//               prefix={<SearchOutlined style={{ color: primaryColor }} />}
//               suffix={
//                 searchUserTerm && (
//                   <CloseOutlined
//                     style={{ cursor: 'pointer', color: '#9CA3AF' }}
//                     onClick={() => setSearchUserTerm('')}
//                   />
//                 )
//               }
//               value={searchUserTerm}
//               onChange={(e) => setSearchUserTerm(e.target.value)}
//               size="large"
//               style={{ borderRadius: '8px' }}
//             />
//           </div>

//           <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
//             {creatingRoom || loadingUsers ? (
//               <div style={{ textAlign: 'center', padding: '40px' }}>
//                 <Spin tip={creatingRoom ? 'Creating chat...' : 'Loading users...'} />
//               </div>
//             ) : filteredUsers.length > 0 ? (
//               <div className="space-y-2">
//                 {filteredUsers.map((userItem) => (
//                   <div
//                     key={userItem._id}
//                     onClick={() => !creatingRoom && handleCreateRoom(userItem)}
//                     className="p-3 rounded-lg cursor-pointer transition-all"
//                     style={{
//                       backgroundColor: '#FFFFFF',
//                       border: '1px solid #E5E7EB',
//                       opacity: creatingRoom ? 0.6 : 1,
//                     }}
//                     onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
//                     onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
//                   >
//                     <div className="flex items-center gap-3">
//                       <Avatar size={44} style={{ backgroundColor: primaryColor, fontWeight: 600 }}>
//                         {userItem.name?.charAt(0)?.toUpperCase()}
//                       </Avatar>
//                       <div className="flex-1 min-w-0">
//                         <div className="flex items-center gap-2 mb-1">
//                           <Text strong style={{ fontSize: '14px' }}>{userItem.name}</Text>
//                           <Badge
//                             color={getRoleBadgeColor(userItem.role)}
//                             text={getRoleDisplayName(userItem.role)}
//                             style={{ fontSize: '11px' }}
//                           />
//                         </div>
//                         <div className="flex flex-col gap-1">
//                           {userItem.phone && (
//                             <div className="flex items-center gap-1">
//                               <PhoneOutlined style={{ color: primaryColor, fontSize: '11px' }} />
//                               <Text style={{ color: '#9CA3AF', fontSize: '11px' }}>{userItem.phone}</Text>
//                             </div>
//                           )}
//                           <div className="flex items-center gap-1">
//                             <MailOutlined style={{ color: primaryColor, fontSize: '11px' }} />
//                             <Text style={{ color: '#9CA3AF', fontSize: '11px' }}>{userItem.email}</Text>
//                           </div>
//                         </div>
//                       </div>
//                       <MessageOutlined style={{ color: primaryColor, fontSize: '18px' }} />
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <Empty description="No contacts found" />
//             )}
//           </div>

//           {/* {filteredUsers.length > 0 && (
//             <div
//               className="mt-4 p-3 rounded-lg flex items-start gap-2"
//               style={{ backgroundColor: `${primaryColor}10`, border: `1px solid ${primaryColor}30` }}
//             >
//               <CheckCircleOutlined style={{ color: primaryColor, fontSize: '16px', marginTop: '2px' }} />
//               <div>
//                 <Text strong style={{ color: primaryColor, display: 'block', fontSize: '13px' }}>
//                   Ready to Chat
//                 </Text>
//                 <Text style={{ color: '#6B7280', fontSize: '12px' }}>
//                   Click on any contact to start chatting
//                 </Text>
//               </div>
//             </div>
//           )} */}
//         </Modal>
//       </>
//     );
//   }

//   // Desktop: Split view with rooms on left, chat on right
//   return (
//     <>
//       <style>{`body { overflow: hidden !important; }`}</style>
//       <div className="fixed top-0 right-0 bottom-0 sm:left-20 left-0 flex" style={{ backgroundColor: theme?.backgroundColor || '#FFFFFF', overflow: 'hidden' }}>
//         {/* Left: Room List */}
//         <div className="hidden md:flex w-96 flex-col" style={{ borderRight: `1px solid ${theme?.sidebarBorderColor || '#E9EDEF'}` }}>
//           <RoomList onCreateRoom={handlePlusClick} />
//         </div>

//         {/* Right: Chat Window */}
//         <div className="flex-1 flex flex-col" style={{ overflow: 'hidden' }}>
//           {activeRoomId ? (
//             <ChatWindow 
//               showMobileHeader={false}
//               onBack={() => dispatch(setActiveRoom(''))}
//             />
//           ) : (
//             <div className="hidden md:flex flex-1 items-center justify-center" style={{ backgroundColor: theme?.chatBackgroundColor || '#F0F2F5' }}>
//               <Empty
//                 image={<MessageOutlined style={{ fontSize: '64px', color: theme?.timestampColor || '#8696A0' }} />}
//                 description={
//                   <span style={{ color: theme?.timestampColor || '#667781', fontSize: '14px' }}>
//                     Select a chat to start messaging
//                   </span>
//                 }
//               />
//             </div>
//           )}
//         </div>
//       </div>

//       <Modal
//         title={
//           <div className="flex items-center gap-3">
//             <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
//               <UserAddOutlined style={{ color: primaryColor, fontSize: '18px' }} />
//             </div>
//             <span style={{ fontSize: '16px', fontWeight: 600 }}>My Contacts</span>
//           </div>
//         }
//         open={showModal}
//         onCancel={() => setShowModal(false)}
//         footer={null}
//         width={500}
//         centered
//       >
//         <div className="mb-4">
//           <Input
//             placeholder="Search by name or email..."
//             prefix={<SearchOutlined style={{ color: primaryColor }} />}
//             suffix={
//               searchUserTerm && (
//                 <CloseOutlined
//                   style={{ cursor: 'pointer', color: '#9CA3AF' }}
//                   onClick={() => setSearchUserTerm('')}
//                 />
//               )
//             }
//             value={searchUserTerm}
//             onChange={(e) => setSearchUserTerm(e.target.value)}
//             size="large"
//             style={{ borderRadius: '8px' }}
//           />
//           <Text style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '8px', display: 'block' }}>
//             {filteredUsers.length} contact{filteredUsers.length !== 1 ? 's' : ''} available
//           </Text>
//         </div>

//         <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
//           {creatingRoom || loadingUsers ? (
//             <div style={{ textAlign: 'center', padding: '40px' }}>
//               <Spin tip={creatingRoom ? 'Creating chat...' : 'Loading contacts...'} />
//             </div>
//           ) : filteredUsers.length > 0 ? (
//             <div className="space-y-2">
//               {filteredUsers.map((userItem) => (
//                 <div
//                   key={userItem._id}
//                   onClick={() => !creatingRoom && handleCreateRoom(userItem)}
//                   className="p-3 rounded-lg cursor-pointer transition-all group"
//                   style={{
//                     backgroundColor: '#FFFFFF',
//                     border: '1px solid #E5E7EB',
//                     opacity: creatingRoom ? 0.6 : 1,
//                   }}
//                   onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D1F4E0'}
//                   onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
//                 >
//                   <div className="flex items-center gap-3">
//                     <Avatar size={44} style={{ backgroundColor: primaryColor, fontWeight: 600 }}>
//                       {userItem.name?.charAt(0)?.toUpperCase()}
//                     </Avatar>
//                       <div className="flex-1 min-w-0">
//                         <div className="flex items-center gap-2 mb-1">
//                           <Text strong style={{ fontSize: '14px' }}>{userItem.name}</Text>
//                           <Badge
//                             color={getRoleBadgeColor(userItem.role)}
//                             text={getRoleDisplayName(userItem.role)}
//                             style={{ fontSize: '11px' }}
//                           />
//                         </div>
//                         <div className="flex flex-col gap-1">
//                           {userItem.phone && (
//                             <div className="flex items-center gap-1">
//                               <PhoneOutlined style={{ color: primaryColor, fontSize: '11px' }} />
//                               <Text style={{ color: '#9CA3AF', fontSize: '11px' }}>{userItem.phone}</Text>
//                             </div>
//                           )}
//                           <div className="flex items-center gap-1">
//                             <MailOutlined style={{ color: primaryColor, fontSize: '11px' }} />
//                             <Text style={{ color: '#9CA3AF', fontSize: '11px' }}>{userItem.email}</Text>
//                           </div>
//                         </div>
//                       </div>
//                     <Button
//                       type="primary"
//                       icon={<MessageOutlined />}
//                       size="small"
//                       style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
//                       className="opacity-0 group-hover:opacity-100 transition-opacity"
//                     />
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <Empty description="No contacts found" />
//           )}
//         </div>

//         {filteredUsers.length > 0 && (
//           <div
//             className="mt-4 p-3 rounded-lg flex items-start gap-2"
//             style={{ backgroundColor: `${primaryColor}10`, border: `2px solid ${primaryColor}30` }}
//           >
//             <CheckCircleOutlined style={{ color: primaryColor, fontSize: '16px', marginTop: '2px' }} />
//             <div>
//               <Text strong style={{ color: primaryColor, display: 'block', fontSize: '13px' }}>
//                 Ready to Chat
//               </Text>
//               <Text style={{ color: '#00A884', fontSize: '12px' }}>
//                 Select a contact to start a secure conversation
//               </Text>
//             </div>
//           </div>
//         )}
//       </Modal>
//     </>
//   );
// }



















// // import { useState, useCallback, useEffect } from 'react';
// // import { useDispatch, useSelector } from 'react-redux';
// // import { useLocation } from 'react-router-dom';
// // import { useSocket } from '../../hooks/useSocket';
// // import { useTheme } from '../../hooks/useTheme';
// // import RoomList from './RoomList';
// // import ChatWindow from './ChatWindow';
// // import {
// //   Modal,
// //   Input,
// //   Avatar,
// //   message,
// //   Spin,
// //   Button,
// //   Empty,
// //   Badge,
// //   Typography,
// //   Divider,
// //   List,
// //   Tag,
// // } from 'antd';
// // import {
// //   SearchOutlined,
// //   MailOutlined,
// //   CloseOutlined,
// //   UserAddOutlined,
// //   MessageOutlined,
// //   CheckCircleOutlined,
// //   ArrowLeftOutlined,
// //   PhoneOutlined,
// //   PlusOutlined,
// //   UserOutlined,
// // } from '@ant-design/icons';
// // import {
// //   createDirectRoom,
// //   createAdminChat,
// //   setActiveRoom,
// //   fetchRooms,
// // } from '../../redux/slices/chatSlice';
// // import { _get, _post } from '../../helper/apiClient';

// // const { Text } = Typography;

// // export default function StandardChatLayout() {
// //   const { theme } = useTheme();
// //   const dispatch = useDispatch();
// //   const location = useLocation();
// //   const { user } = useSelector((s) => s.auth);
// //   const { activeRoomId } = useSelector((s) => s.chat);

// //   const [showModal, setShowModal] = useState(false);
// //   const [creatingRoom, setCreatingRoom] = useState(false);
// //   const [chatOpened, setChatOpened] = useState(false);
// //   const [searchTerm, setSearchTerm] = useState('');
// //   const [displayUsers, setDisplayUsers] = useState([]); // Saved contacts or all users
// //   const [searchResults, setSearchResults] = useState([]);
// //   const [loadingUsers, setLoadingUsers] = useState(false);
// //   const [searchLoading, setSearchLoading] = useState(false);

// //   useSocket();

// //   // Check if we should open chat from navigation state
// //   useEffect(() => {
// //     if (location.state?.openChat && activeRoomId) {
// //       setChatOpened(true);
// //     }
// //   }, [location.state, activeRoomId]);

// //   // Determine user role
// //   const isSuperAdmin = user?.role === 'SUPER_ADMIN';
// //   const isAdmin = ['ADMIN', 'TENANT_ADMIN'].includes(user?.role);
// //   const isRegularUser = user?.role === 'USER';
// //   const isNonSuperAdmin = isAdmin || isRegularUser;

// //   // ✅ Handle plus button click
// //   const handlePlusClick = async () => {
// //     setShowModal(true);
// //     setSearchTerm('');
// //     setDisplayUsers([]);
// //     setSearchResults([]);
// //     setLoadingUsers(true);

// //     try {
// //       if (isSuperAdmin) {
// //         // Load all available users for SUPER_ADMIN
// //         const response = await _get('/users/available');
// //         setDisplayUsers(response?.data?.users || []);
// //       } else if (isNonSuperAdmin) {
// //         // Load saved contacts for ADMIN/USER
// //         const response = await _get('/contacts');
// //         const contacts = response?.data?.contacts || response?.data?.data?.contacts || [];
// //         setDisplayUsers(
// //           contacts.map((c) => ({
// //             _id: c.userId?._id || c.userId,
// //             name: c.userId?.name || c.name,
// //             email: c.userId?.email || c.email,
// //             phone: c.userId?.phone || c.phone,
// //             avatar: c.userId?.avatar || c.avatar,
// //             role: c.userId?.role || c.role,
// //             contactName: c.contactName,
// //           }))
// //         );
// //       }
// //     } catch (error) {
// //       message.error('Failed to load users/contacts');
// //       console.error('Error loading users:', error);
// //     } finally {
// //       setLoadingUsers(false);
// //     }
// //   };

// //   // ✅ Handle search for ADMIN/USER only
// //   const handleSearch = useCallback(
// //     async (query) => {
// //       setSearchTerm(query);

// //       if (!query.trim()) {
// //         setSearchResults([]);
// //         return;
// //       }

// //       if (isNonSuperAdmin) {
// //         setSearchLoading(true);
// //         try {
// //           // Search system users by email or phone
// //           const response = await _get(`/users/search?query=${query}`);
// //           const users = response?.data?.users || [];

// //           // Format and set search results
// //           setSearchResults(
// //             users.map((u) => ({
// //               _id: u._id,
// //               name: u.name,
// //               email: u.email,
// //               phone: u.phone,
// //               avatar: u.avatar,
// //               role: u.role,
// //               isSearchResult: true,
// //             }))
// //           );
// //         } catch (error) {
// //           console.error('Error searching users:', error);
// //           message.error('Search failed');
// //         } finally {
// //           setSearchLoading(false);
// //         }
// //       }
// //     },
// //     [isNonSuperAdmin]
// //   );

// //   // ✅ Check if user is already in contacts
// //   const isUserInContacts = useCallback(
// //     (userId) => {
// //       return displayUsers.some((u) => u._id === userId);
// //     },
// //     [displayUsers]
// //   );

// //   // ✅ Add contact and create room (for ADMIN/USER)
// //   const handleAddContactAndChat = async (selectedUser) => {
// //     try {
// //       setCreatingRoom(true);

// //       // First, add contact
// //       try {
// //         await _post('/contacts/add', {
// //           identifier: selectedUser.email || selectedUser.phone,
// //           contactName: selectedUser.name,
// //         });
// //         message.success('Contact added');
// //       } catch (error) {
// //         if (error.response?.status !== 400) {
// //           throw error; // Re-throw if not "already exists" error
// //         }
// //         // Contact already exists, continue to create room
// //       }

// //       // Then create room
// //       const currentUserIsAdmin = ['ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN'].includes(
// //         user?.role
// //       );
// //       const selectedUserIsAdmin = ['ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN'].includes(
// //         selectedUser.role
// //       );
// //       const isAdminChat = currentUserIsAdmin && selectedUserIsAdmin;

// //       const result = isAdminChat
// //         ? await dispatch(
// //             createAdminChat({
// //               adminId: selectedUser._id,
// //             })
// //           ).unwrap()
// //         : await dispatch(
// //             createDirectRoom({
// //               userId: selectedUser._id,
// //             })
// //           ).unwrap();

// //       const roomId = result?.data?.room?._id || result?.room?._id || result?._id;

// //       if (roomId) {
// //         dispatch(setActiveRoom(roomId));
// //         dispatch(fetchRooms());
// //         setChatOpened(true);
// //         message.success('Chat opened successfully');
// //         setShowModal(false);
// //       }
// //     } catch (error) {
// //       console.error('Error:', error);
// //       message.error(error?.response?.data?.message || 'Failed to create chat');
// //     } finally {
// //       setCreatingRoom(false);
// //     }
// //   };

// //   // ✅ Create room with existing contact (for SUPER_ADMIN or existing contact)
// //   const handleCreateRoom = async (selectedUser) => {
// //     try {
// //       setCreatingRoom(true);

// //       const currentUserIsAdmin = ['ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN'].includes(
// //         user?.role
// //       );
// //       const selectedUserIsAdmin = ['ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN'].includes(
// //         selectedUser.role
// //       );
// //       const isAdminChat = currentUserIsAdmin && selectedUserIsAdmin;

// //       const result = isAdminChat
// //         ? await dispatch(
// //             createAdminChat({
// //               adminId: selectedUser._id,
// //             })
// //           ).unwrap()
// //         : await dispatch(
// //             createDirectRoom({
// //               userId: selectedUser._id,
// //             })
// //           ).unwrap();

// //       const roomId = result?.data?.room?._id || result?.room?._id || result?._id;

// //       if (roomId) {
// //         dispatch(setActiveRoom(roomId));
// //         dispatch(fetchRooms());
// //         setChatOpened(true);
// //         message.success('Chat opened successfully');
// //         setShowModal(false);
// //       }
// //     } catch (error) {
// //       console.error('Error:', error);
// //       message.error('Failed to create chat');
// //     } finally {
// //       setCreatingRoom(false);
// //     }
// //   };

// //   // ✅ Get role badge color
// //   const getRoleBadgeColor = useCallback((role) => {
// //     switch (role) {
// //       case 'ADMIN':
// //       case 'TENANT_ADMIN':
// //         return '#EF4444';
// //       case 'SUPER_ADMIN':
// //         return '#8B5CF6';
// //       case 'USER':
// //         return '#10B981';
// //       default:
// //         return '#9CA3AF';
// //     }
// //   }, []);

// //   const getRoleDisplayName = useCallback((role) => {
// //     const roleMap = {
// //       ADMIN: 'Admin',
// //       TENANT_ADMIN: 'Tenant Admin',
// //       SUPER_ADMIN: 'Super Admin',
// //       USER: 'User',
// //     };
// //     return roleMap[role] || role;
// //   }, []);

// //   // ✅ Get users to display (with search results if searching)
// //   const usersToDisplay = searchTerm ? searchResults : displayUsers;
// //   const primaryColor = theme?.primaryColor || '#008069';

// //   // Mobile: Show room list or chat based on chatOpened state
// //   if (window.innerWidth < 768) {
// //     if (chatOpened && activeRoomId) {
// //       return (
// //         <>
// //           <div className="w-full h-screen flex flex-col">
// //             <div
// //               className="px-4 py-3 flex items-center justify-between border-b"
// //               style={{ backgroundColor: primaryColor }}
// //             >
// //               <button
// //                 onClick={() => setChatOpened(false)}
// //                 className="text-white p-2"
// //               >
// //                 <ArrowLeftOutlined style={{ fontSize: '18px' }} />
// //               </button>
// //               <h1 className="text-white font-semibold flex-1 ml-3">Chat</h1>
// //             </div>
// //             <ChatWindow />
// //           </div>
// //         </>
// //       );
// //     }

// //     // Mobile: Room list view
// //     return (
// //       <div className="w-full h-screen flex flex-col">
// //         {/* Header */}
// //         <div
// //           className="px-4 py-3 flex items-center justify-between border-b"
// //           style={{ backgroundColor: primaryColor }}
// //         >
// //           <h1 className="text-white font-semibold text-lg">Chats</h1>
// //           <button
// //             onClick={handlePlusClick}
// //             className="text-white p-2 hover:bg-white/20 rounded-full transition"
// //           >
// //             <PlusOutlined style={{ fontSize: '18px' }} />
// //           </button>
// //         </div>

// //         {/* Room List */}
// //         <div className="flex-1 overflow-y-auto">
// //           <RoomList onRoomClick={() => {}} />
// //         </div>
// //       </div>
// //     );
// //   }

// //   // Desktop: Two-column layout (Room list + Chat)
// //   return (
// //     <div className="flex h-screen bg-white">
// //       {/* Left Sidebar - Room List */}
// //       <div className="w-96 flex flex-col border-r border-gray-200">
// //         {/* Header */}
// //         <div
// //           className="px-4 py-4 flex items-center justify-between border-b"
// //           style={{ backgroundColor: primaryColor }}
// //         >
// //           <h2 className="text-white font-bold text-lg">Chats</h2>
// //           <button
// //             onClick={handlePlusClick}
// //             className="text-white p-2 hover:bg-white/20 rounded-full transition"
// //           >
// //             <PlusOutlined style={{ fontSize: '18px' }} />
// //           </button>
// //         </div>

// //         {/* Room List */}
// //         <div className="flex-1 overflow-y-auto">
// //           <RoomList onRoomClick={() => {}} />
// //         </div>
// //       </div>

// //       {/* Right Side - Chat Area */}
// //       <div className="flex-1 flex flex-col bg-gray-50">
// //         {activeRoomId ? (
// //           <ChatWindow />
// //         ) : (
// //           <div className="flex items-center justify-center h-full">
// //             <Empty
// //               image={Empty.PRESENTED_IMAGE_SIMPLE}
// //               description="Select a chat to start messaging"
// //               style={{ marginTop: '0' }}
// //             />
// //           </div>
// //         )}
// //       </div>

// //       {/* Modal for New Chat */}
// //       <Modal
// //         title={
// //           <div className="flex items-center gap-3">
// //             {isSuperAdmin ? (
// //               <>
// //                 <UserOutlined style={{ color: primaryColor, fontSize: '18px' }} />
// //                 <span>Select Admin to Chat</span>
// //               </>
// //             ) : (
// //               <>
// //                 <MailOutlined style={{ color: primaryColor, fontSize: '18px' }} />
// //                 <span>Start a New Chat</span>
// //               </>
// //             )}
// //           </div>
// //         }
// //         open={showModal}
// //         onCancel={() => setShowModal(false)}
// //         footer={null}
// //         width={500}
// //         bodyStyle={{
// //           maxHeight: '70vh',
// //           overflowY: 'auto',
// //           padding: '20px',
// //         }}
// //       >
// //         {/* Search Box - For ADMIN/USER Only */}
// //         {isNonSuperAdmin && (
// //           <div className="mb-4">
// //             <div className="flex gap-2 mb-3">
// //               <Input
// //                 placeholder="Search by email or phone..."
// //                 prefix={<SearchOutlined style={{ color: primaryColor }} />}
// //                 value={searchTerm}
// //                 onChange={(e) => handleSearch(e.target.value)}
// //                 size="large"
// //                 className="rounded-lg"
// //                 style={{
// //                   borderColor: primaryColor,
// //                 }}
// //               />
// //             </div>
// //             {searchTerm && !searchLoading && (
// //               <p className="text-xs text-gray-500">
// //                 Found {usersToDisplay.length} result{usersToDisplay.length !== 1 ? 's' : ''}
// //               </p>
// //             )}
// //           </div>
// //         )}

// //         {/* Loading State */}
// //         {loadingUsers && !showModal ? null : null}
// //         {(loadingUsers || searchLoading) && (
// //           <div className="flex justify-center py-8">
// //             <Spin />
// //           </div>
// //         )}

// //         {/* Users List */}
// //         {!loadingUsers && !searchLoading && usersToDisplay.length > 0 ? (
// //           <List
// //             dataSource={usersToDisplay}
// //             renderItem={(selectedUser) => (
// //               <List.Item
// //                 key={selectedUser._id}
// //                 className="hover:bg-gray-50 rounded-lg px-2 py-2 cursor-pointer transition"
// //               >
// //                 <List.Item.Meta
// //                   avatar={
// //                     <Avatar
// //                       size={40}
// //                       style={{ backgroundColor: primaryColor }}
// //                     >
// //                       {selectedUser.name?.charAt(0)?.toUpperCase() || '?'}
// //                     </Avatar>
// //                   }
// //                   title={
// //                     <div className="flex items-center gap-2">
// //                       <span className="font-semibold text-sm">
// //                         {selectedUser.contactName || selectedUser.name}
// //                       </span>
// //                       <Tag
// //                         color={getRoleBadgeColor(selectedUser.role)}
// //                         className="text-xs"
// //                       >
// //                         {getRoleDisplayName(selectedUser.role)}
// //                       </Tag>
// //                     </div>
// //                   }
// //                   description={
// //                     <div className="text-xs text-gray-500 space-y-0.5">
// //                       {selectedUser.email && <div>{selectedUser.email}</div>}
// //                       {selectedUser.phone && <div>{selectedUser.phone}</div>}
// //                     </div>
// //                   }
// //                 />
// //                 <div>
// //                   {isNonSuperAdmin && selectedUser.isSearchResult && !isUserInContacts(selectedUser._id) ? (
// //                     <Button
// //                       type="primary"
// //                       size="small"
// //                       onClick={() => handleAddContactAndChat(selectedUser)}
// //                       loading={creatingRoom}
// //                       style={{
// //                         backgroundColor: primaryColor,
// //                         borderColor: primaryColor,
// //                       }}
// //                     >
// //                       Add & Chat
// //                     </Button>
// //                   ) : (
// //                     <Button
// //                       type="primary"
// //                       size="small"
// //                       onClick={() => handleCreateRoom(selectedUser)}
// //                       loading={creatingRoom}
// //                       style={{
// //                         backgroundColor: primaryColor,
// //                         borderColor: primaryColor,
// //                       }}
// //                     >
// //                       Chat
// //                     </Button>
// //                   )}
// //                 </div>
// //               </List.Item>
// //             )}
// //           />
// //         ) : !loadingUsers && !searchLoading && !searchTerm ? (
// //           <Empty
// //             image={Empty.PRESENTED_IMAGE_SIMPLE}
// //             description={
// //               isSuperAdmin
// //                 ? 'No admins available'
// //                 : 'No contacts yet. Search by email or phone to add new contacts.'
// //             }
// //             style={{ marginTop: '40px' }}
// //           />
// //         ) : !loadingUsers && !searchLoading && searchTerm ? (
// //           <Empty
// //             image={Empty.PRESENTED_IMAGE_SIMPLE}
// //             description="No users found with this email or phone"
// //             style={{ marginTop: '40px' }}
// //           />
// //         ) : null}
// //       </Modal>
// //     </div>
// //   );
// // }





import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import { useTheme } from '../../hooks/useTheme';
import RoomList from './RoomList';
import ChatWindow from './ChatWindow';
import {
  Modal,
  Input,
  Avatar,
  message,
  Spin,
  Button,
  Empty,
  Badge,
  Typography,
  Switch,
} from 'antd';
import {
  SearchOutlined,
  MailOutlined,
  CloseOutlined,
  UserAddOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import {
  createDirectRoom,
  createAdminChat,
  setActiveRoom,
  fetchRooms,
  fetchAvailableUsers,
} from '../../redux/slices/chatSlice';
import { _get, _post } from '../../helper/apiClient';

const { Text } = Typography;

export default function StandardChatLayout() {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const { activeRoomId } = useSelector((s) => s.chat);

  const [showModal, setShowModal] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchUserTerm, setSearchUserTerm] = useState('');
  const [chatOpened, setChatOpened] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useSocket();

  // Debug: Log when searchResults changes
  useEffect(() => {
    console.log('searchResults state updated:', searchResults);
  }, [searchResults]);

  // Check if we should open chat from navigation state
  useEffect(() => {
    if (location.state?.openChat && activeRoomId) {
      setChatOpened(true);
    }
  }, [location.state, activeRoomId]);

  // Determine user role
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = ['ADMIN', 'TENANT_ADMIN'].includes(user?.role);
  const isRegularUser = user?.role === 'USER';
  const isNonSuperAdmin = isAdmin || isRegularUser;

  // ✅ Handle plus button click
  const handlePlusClick = async () => {
    setShowModal(true);
    setSearchUserTerm('');
    setSearchResults([]);
    setAvailableUsers([]);
    setLoadingUsers(true);

    try {
      if (isSuperAdmin) {
        // Load all available users for SUPER_ADMIN
        try {
          const response = await dispatch(fetchAvailableUsers({ contactsOnly: false })).unwrap();
          setAvailableUsers(response?.data?.users || response?.users || []);
        } catch (error) {
          // Fallback if Redux action fails
          const response = await _get('/users/available');
          setAvailableUsers(response?.data?.users || []);
        }
      } else if (isNonSuperAdmin) {
        // Load saved contacts for ADMIN/USER
        try {
          const response = await _get('/contacts');
          const contacts = response?.data?.contacts || response?.data?.data?.contacts || [];
          setAvailableUsers(
            contacts.map((c) => ({
              _id: c.userId?._id || c.userId,
              name: c.userId?.name || c.name,
              email: c.userId?.email || c.email,
              phone: c.userId?.phone || c.phone,
              avatar: c.userId?.avatar || c.avatar,
              role: c.userId?.role || c.role,
              contactName: c.contactName,
            }))
          );
        } catch (error) {
          message.error('Failed to load contacts');
          console.error('Error loading contacts:', error);
        }
      }
    } catch (error) {
      message.error('Failed to load users');
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // ✅ Handle search for ADMIN/USER only
  const handleSearchClick = async () => {
    if (!searchUserTerm.trim()) {
      setSearchResults([]);
      return;
    }

    if (isNonSuperAdmin) {
      setSearchLoading(true);
      try {
        const response = await _get(`/users/search?query=${searchUserTerm}`);
        const users = response?.data?.users || [];
        
        console.log('Search response:', response);
        console.log('Users found:', users);

        const mappedUsers = users.map((u) => ({
          _id: u._id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          avatar: u.avatar,
          role: u.role,
          isSearchResult: true,
        }));
        
        console.log('Mapped users before setState:', mappedUsers);
        setSearchResults(mappedUsers);
        console.log('setSearchResults called with:', mappedUsers);
      } catch (error) {
        console.error('Error searching users:', error);
        message.error('Search failed');
      } finally {
        setSearchLoading(false);
      }
    }
  };

  const isUserInContacts = useCallback(
    (userId) => {
      return availableUsers.some((u) => u._id === userId);
    },
    [availableUsers]
  );

  // ✅ Add contact and create room (for ADMIN/USER)
  const handleAddContactAndChat = async (selectedUser) => {
    try {
      setCreatingRoom(true);

      // First, add contact
      try {
        await _post('/contacts/add', {
          identifier: selectedUser.email || selectedUser.phone,
          contactName: selectedUser.name,
        });
        message.success('Contact added');
      } catch (error) {
        if (error.response?.status !== 400) {
          throw error; // Re-throw if not "already exists" error
        }
        // Contact already exists, continue to create room
      }

      // Then create room
      const currentUserIsAdmin = ['ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN'].includes(
        user?.role
      );
      const selectedUserIsAdmin = ['ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN'].includes(
        selectedUser.role
      );
      const isAdminChat = currentUserIsAdmin && selectedUserIsAdmin;

      const result = isAdminChat
        ? await dispatch(
            createAdminChat({
              adminId: selectedUser._id,
            })
          ).unwrap()
        : await dispatch(
            createDirectRoom({
              userId: selectedUser._id,
            })
          ).unwrap();

      const roomId = result?.data?.room?._id || result?.room?._id || result?._id;

      if (roomId) {
        dispatch(setActiveRoom(roomId));
        dispatch(fetchRooms());
        setChatOpened(true);
        message.success('Chat opened successfully');
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error:', error);
      message.error(error?.response?.data?.message || 'Failed to create chat');
    } finally {
      setCreatingRoom(false);
    }
  };

  // ✅ Create room with existing contact (for SUPER_ADMIN or existing contact)
  const handleCreateRoom = async (selectedUser) => {
    try {
      setCreatingRoom(true);

      const currentUserIsAdmin = ['ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN'].includes(
        user?.role
      );
      const selectedUserIsAdmin = ['ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN'].includes(
        selectedUser.role
      );
      const isAdminChat = currentUserIsAdmin && selectedUserIsAdmin;

      const result = isAdminChat
        ? await dispatch(
            createAdminChat({
              adminId: selectedUser._id,
            })
          ).unwrap()
        : await dispatch(
            createDirectRoom({
              userId: selectedUser._id,
            })
          ).unwrap();

      const roomId = result?.data?.room?._id || result?.room?._id || result?._id;

      if (roomId) {
        dispatch(setActiveRoom(roomId));
        dispatch(fetchRooms());
        setChatOpened(true);
        message.success('Chat opened successfully');
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('Failed to create chat');
    } finally {
      setCreatingRoom(false);
    }
  };

  // ✅ Get role badge color
  const getRoleBadgeColor = useCallback((role) => {
    switch (role) {
      case 'ADMIN':
      case 'TENANT_ADMIN':
        return '#EF4444';
      case 'SUPER_ADMIN':
        return '#8B5CF6';
      case 'USER':
        return '#00A884';
      default:
        return '#9CA3AF';
    }
  }, []);

  const getRoleDisplayName = useCallback((role) => {
    const roleMap = {
      'ADMIN': 'Admin',
      'TENANT_ADMIN': 'Tenant Admin',
      'SUPER_ADMIN': 'Super Admin',
      'USER': 'User',
    };
    return roleMap[role] || role;
  }, []);

  // ✅ Get users to display (with search results if searching, or contacts/available users)
  const usersToDisplay = searchUserTerm ? searchResults : availableUsers;
  
  console.log('searchUserTerm:', searchUserTerm);
  console.log('searchResults:', searchResults);
  console.log('availableUsers:', availableUsers);
  console.log('usersToDisplay:', usersToDisplay);
  
  const primaryColor = theme?.primaryColor || '#008069';

  // Mobile: Show room list or chat based on chatOpened state
  if (window.innerWidth < 768) {
    if (chatOpened && activeRoomId) {
      return (
        <>
          <style>{`
            body { overflow: hidden !important; }
            nav[class*="bottom-0"] { display: none !important; }
          `}</style>
          <div className="fixed inset-0 flex flex-col z-[150]" style={{ backgroundColor: theme?.backgroundColor || '#FFFFFF', overflow: 'hidden' }}>
            <ChatWindow 
              showMobileHeader={true}
              readOnly={false}
              onBack={() => {
                dispatch(setActiveRoom(''));
                setTimeout(() => setChatOpened(false), 0);
              }}
            />
          </div>
        </>
      );
    }
    
    // Show room list when chat is not opened
    return (
      <>
        <style>{`body { overflow: hidden !important; }`}</style>
        <div className="fixed top-0 left-0 right-0 bottom-14 flex flex-col z-10" style={{ backgroundColor: theme?.backgroundColor || '#F0F2F5', overflow: 'hidden' }}>
          <div className="flex-1 overflow-hidden">
            <RoomList onCreateRoom={handlePlusClick} onRoomClick={() => setChatOpened(true)} />
          </div>
        </div>

        <Modal
          title={
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                <UserAddOutlined style={{ color: primaryColor, fontSize: '18px' }} />
              </div>
              <span style={{ fontSize: '16px', fontWeight: 600 }}>
                {isSuperAdmin ? 'Select Admin to Chat' : 'My Contacts'}
              </span>
            </div>
          }
          open={showModal}
          onCancel={() => setShowModal(false)}
          footer={null}
          width={500}
          centered
        >
          {/* Search Box - For ADMIN/USER Only */}
          {isNonSuperAdmin && (
            <div className="mb-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name or email..."
                  value={searchUserTerm}
                  onChange={(e) => setSearchUserTerm(e.target.value)}
                  onPressEnter={handleSearchClick}
                  size="large"
                  style={{ borderRadius: '8px', flex: 1 }}
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearchClick}
                  loading={searchLoading}
                  size="large"
                  style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                >
                  Search
                </Button>
              </div>
              {searchUserTerm && !searchLoading && (
                <Text style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '8px', display: 'block' }}>
                  Found {usersToDisplay.length} result{usersToDisplay.length !== 1 ? 's' : ''}
                </Text>
              )}
            </div>
          )}

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {creatingRoom || loadingUsers || searchLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin tip={creatingRoom ? 'Creating chat...' : searchLoading ? 'Searching...' : 'Loading...'} />
              </div>
            ) : usersToDisplay.length > 0 ? (
              <div className="space-y-2">
                {usersToDisplay.map((userItem) => (
                  <div
                    key={userItem._id}
                    className="p-3 rounded-lg cursor-pointer transition-all group"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      opacity: creatingRoom ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D1F4E0'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar size={44} style={{ backgroundColor: primaryColor, fontWeight: 600 }}>
                        {userItem.name?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Text strong style={{ fontSize: '14px' }}>
                            {userItem.contactName || userItem.name}
                          </Text>
                          <Badge
                            color={getRoleBadgeColor(userItem.role)}
                            text={getRoleDisplayName(userItem.role)}
                            style={{ fontSize: '11px' }}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          {userItem.phone && (
                            <div className="flex items-center gap-1">
                              <PhoneOutlined style={{ color: primaryColor, fontSize: '11px' }} />
                              <Text style={{ color: '#9CA3AF', fontSize: '11px' }}>{userItem.phone}</Text>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <MailOutlined style={{ color: primaryColor, fontSize: '11px' }} />
                            <Text style={{ color: '#9CA3AF', fontSize: '11px' }}>{userItem.email}</Text>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="primary"
                        icon={<MessageOutlined />}
                        size="small"
                        onClick={() => {
                          if (isNonSuperAdmin && userItem.isSearchResult && !isUserInContacts(userItem._id)) {
                            handleAddContactAndChat(userItem);
                          } else {
                            handleCreateRoom(userItem);
                          }
                        }}
                        loading={creatingRoom}
                        style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                      >
                        {isNonSuperAdmin && userItem.isSearchResult && !isUserInContacts(userItem._id) ? 'Add' : 'Chat'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty 
                description={
                  isSuperAdmin
                    ? 'No admins available'
                    : searchUserTerm
                    ? 'No users found'
                    : 'No contacts yet. Search to add new contacts.'
                }
              />
            )}
          </div>

          {usersToDisplay.length > 0 && (
            <div
              className="mt-4 p-3 rounded-lg flex items-start gap-2"
              style={{ backgroundColor: `${primaryColor}10`, border: `1px solid ${primaryColor}30` }}
            >
              <CheckCircleOutlined style={{ color: primaryColor, fontSize: '16px', marginTop: '2px' }} />
              <div>
                <Text strong style={{ color: primaryColor, display: 'block', fontSize: '13px' }}>
                  Ready to Chat
                </Text>
                <Text style={{ color: '#6B7280', fontSize: '12px' }}>
                  Click on any contact to start chatting
                </Text>
              </div>
            </div>
          )}
        </Modal>
      </>
    );
  }

  // Desktop: Split view with rooms on left, chat on right
  return (
    <>
      <style>{`body { overflow: hidden !important; }`}</style>
      <div className="fixed top-0 right-0 bottom-0 sm:left-20 left-0 flex" style={{ backgroundColor: theme?.backgroundColor || '#FFFFFF', overflow: 'hidden' }}>
        {/* Left: Room List */}
        <div className="hidden md:flex w-96 flex-col" style={{ borderRight: `1px solid ${theme?.sidebarBorderColor || '#E9EDEF'}` }}>
          <RoomList onCreateRoom={handlePlusClick} />
        </div>

        {/* Right: Chat Window */}
        <div className="flex-1 flex flex-col" style={{ overflow: 'hidden' }}>
          {activeRoomId ? (
            <ChatWindow 
              showMobileHeader={false}
              readOnly={false}
              onBack={() => dispatch(setActiveRoom(''))}
            />
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center" style={{ backgroundColor: theme?.chatBackgroundColor || '#F0F2F5' }}>
              <Empty
                image={<MessageOutlined style={{ fontSize: '64px', color: theme?.timestampColor || '#8696A0' }} />}
                description={
                  <span style={{ color: theme?.timestampColor || '#667781', fontSize: '14px' }}>
                    Select a chat to start messaging
                  </span>
                }
              />
            </div>
          )}
        </div>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
              <UserAddOutlined style={{ color: primaryColor, fontSize: '18px' }} />
            </div>
            <span style={{ fontSize: '16px', fontWeight: 600 }}>
              {isSuperAdmin ? 'Select Admin to Chat' : 'My Contacts'}
            </span>
          </div>
        }
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
        width={500}
        centered
      >
        {/* Search Box - For ADMIN/USER Only */}
        {isNonSuperAdmin && (
          <div className="mb-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by name or email..."
                value={searchUserTerm}
                onChange={(e) => setSearchUserTerm(e.target.value)}
                onPressEnter={handleSearchClick}
                size="large"
                style={{ borderRadius: '8px', flex: 1 }}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearchClick}
                loading={searchLoading}
                size="large"
                style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
              >
                Search
              </Button>
            </div>
            {searchUserTerm && !searchLoading && (
              <Text style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '8px', display: 'block' }}>
                Found {usersToDisplay.length} result{usersToDisplay.length !== 1 ? 's' : ''}
              </Text>
            )}
          </div>
        )}

        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {creatingRoom || loadingUsers || searchLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin tip={creatingRoom ? 'Creating chat...' : searchLoading ? 'Searching...' : 'Loading...'} />
            </div>
          ) : usersToDisplay.length > 0 ? (
            <div className="space-y-2">
              {usersToDisplay.map((userItem) => (
                <div
                  key={userItem._id}
                  className="p-3 rounded-lg cursor-pointer transition-all group"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    opacity: creatingRoom ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D1F4E0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                >
                  <div className="flex items-center gap-3">
                    <Avatar size={44} style={{ backgroundColor: primaryColor, fontWeight: 600 }}>
                      {userItem.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Text strong style={{ fontSize: '14px' }}>
                          {userItem.contactName || userItem.name}
                        </Text>
                        <Badge
                          color={getRoleBadgeColor(userItem.role)}
                          text={getRoleDisplayName(userItem.role)}
                          style={{ fontSize: '11px' }}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        {userItem.phone && (
                          <div className="flex items-center gap-1">
                            <PhoneOutlined style={{ color: primaryColor, fontSize: '11px' }} />
                            <Text style={{ color: '#9CA3AF', fontSize: '11px' }}>{userItem.phone}</Text>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <MailOutlined style={{ color: primaryColor, fontSize: '11px' }} />
                          <Text style={{ color: '#9CA3AF', fontSize: '11px' }}>{userItem.email}</Text>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="primary"
                      icon={<MessageOutlined />}
                      size="small"
                      onClick={() => {
                        if (isNonSuperAdmin && userItem.isSearchResult && !isUserInContacts(userItem._id)) {
                          handleAddContactAndChat(userItem);
                        } else {
                          handleCreateRoom(userItem);
                        }
                      }}
                      loading={creatingRoom}
                      style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {isNonSuperAdmin && userItem.isSearchResult && !isUserInContacts(userItem._id) ? 'Add' : 'Chat'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              description={
                isSuperAdmin
                  ? 'No admins available'
                  : searchUserTerm
                  ? 'No users found'
                  : 'No contacts yet. Search to add new contacts.'
              }
            />
          )}
        </div>

        {/* {usersToDisplay.length > 0 && (
          <div
            className="mt-4 p-3 rounded-lg flex items-start gap-2"
            style={{ backgroundColor: `${primaryColor}10`, border: `2px solid ${primaryColor}30` }}
          >
            <CheckCircleOutlined style={{ color: primaryColor, fontSize: '16px', marginTop: '2px' }} />
            <div>
              <Text strong style={{ color: primaryColor, display: 'block', fontSize: '13px' }}>
                Ready to Chat
              </Text>
              <Text style={{ color: '#00A884', fontSize: '12px' }}>
                Select a contact to start a secure conversation
              </Text>
            </div>
          </div>
        )} */}
      </Modal>
    </>
  );
}