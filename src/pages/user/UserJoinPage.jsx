// import { useEffect, useState } from 'react';
// import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
// import { useTheme } from '../../hooks/useTheme';
// import { fetchTenantTheme } from '../../redux/slices/themeSlice';
// import {
//   Card,
//   Button,
//   Typography,
//   Spin,
//   Result,
//   Space,
//   Avatar,
//   Divider,
//   Row,
//   Col,
// } from 'antd';
// import {
//   CheckCircleOutlined,
//   ExclamationCircleOutlined,
//   ArrowRightOutlined,
//   LockOutlined,
//   UserAddOutlined,
//   MessageOutlined,
// } from '@ant-design/icons';

// const { Title, Text, Paragraph } = Typography;

// export default function UserJoinPage() {
//   const { tenantSlug } = useParams();
//   const [searchParams] = useSearchParams();
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { theme } = useTheme();
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(false);

//   const inviteToken = searchParams.get('token');

//   useEffect(() => {
//     const loadTheme = async () => {
//       try {
//         if (tenantSlug) {
//           await dispatch(fetchTenantTheme(tenantSlug));
//         }
//         setLoading(false);
//       } catch (err) {
//         setError(true);
//         setLoading(false);
//       }
//     };
//     loadTheme();
//   }, [tenantSlug, dispatch]);

//   const handleContinue = () => {
//     if (inviteToken) {
//       navigate(`/register?tenant=${tenantSlug}&token=${inviteToken}`);
//     } else {
//       navigate('/login');
//     }
//   };

//   if (loading) {
//     return (
//       <div
//         className="min-h-screen flex items-center justify-center"
//         style={{ backgroundColor: theme?.sidebarBackgroundColor || '#F0F2F5' }}
//       >
//         <Spin size="large" tip="Loading workspace..." />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div
//         className="min-h-screen flex items-center justify-center p-4"
//         style={{ backgroundColor: theme?.sidebarBackgroundColor || '#F0F2F5' }}
//       >
//         <Card className="w-full max-w-md border-0 shadow-lg" style={{ border: `1px solid ${theme?.borderColor || '#E9EDEF'}` }}>
//           <Result
//             status="error"
//             title="Workspace Not Found"
//             subTitle="The workspace you're looking for doesn't exist or is unavailable."
//             extra={
//               <Button
//                 type="primary"
//                 size="large"
//                 onClick={() => navigate('/login')}
//                 style={{
//                   backgroundColor: theme?.primaryColor || '#008069',
//                   borderColor: theme?.primaryColor || '#008069',
//                 }}
//               >
//                 Back to Login
//               </Button>
//             }
//           />
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div
//       className="min-h-screen py-8 px-4 sm:px-6 md:px-8"
//       style={{ backgroundColor: theme?.sidebarBackgroundColor || '#F0F2F5' }}
//     >
//       <div className="max-w-5xl mx-auto">
//         <Row gutter={[32, 32]} align="middle">
//           {/* Left Side - Welcome */}
//           <Col xs={24} lg={12}>
//             <div className="space-y-6">
//               {/* Logo/Icon */}
//               <div>
//                 <div
//                   className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
//                   style={{
//                     backgroundColor: `${theme?.primaryColor || '#008069'}20`,
//                   }}
//                 >
//                   <MessageOutlined
//                     style={{
//                       fontSize: '40px',
//                       color: theme?.primaryColor || '#008069',
//                     }}
//                   />
//                 </div>
//                 <Title
//                   level={2}
//                   style={{
//                     color: theme?.primaryColor || '#008069',
//                     margin: 0,
//                   }}
//                 >
//                   Welcome
//                 </Title>
//                 <Paragraph
//                   style={{
//                     color: '#6B7280',
//                     fontSize: '16px',
//                     marginTop: '12px',
//                   }}
//                 >
//                   Join our team and start communicating securely with your
//                   colleagues in a professional environment.
//                 </Paragraph>
//               </div>

//               <Divider />

//               {/* Features */}
//               <div className="space-y-4">
//                 {[
//                   { icon: MessageOutlined, title: 'Secure Messaging' },
//                   {
//                     icon: UserAddOutlined,
//                     title: 'Collaborate with Teams',
//                   },
//                   {
//                     icon: CheckCircleOutlined,
//                     title: 'Professional Workspace',
//                   },
//                 ].map((feature, idx) => {
//                   const Icon = feature.icon;
//                   return (
//                     <div key={idx} className="flex items-start gap-3">
//                       <div
//                         className="p-2 rounded-lg flex-shrink-0"
//                         style={{
//                           backgroundColor: `${theme?.primaryColor || '#008069'}15`,
//                         }}
//                       >
//                         <Icon
//                           style={{
//                             color: theme?.primaryColor || '#008069',
//                             fontSize: '18px',
//                           }}
//                         />
//                       </div>
//                       <div>
//                         <Text
//                           strong
//                           style={{
//                             color: '#1F2937',
//                             display: 'block',
//                             marginBottom: '4px',
//                           }}
//                         >
//                           {feature.title}
//                         </Text>
//                         <Text style={{ color: '#9CA3AF', fontSize: '14px' }}>
//                           Experience seamless communication
//                         </Text>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           </Col>

//           {/* Right Side - CTA */}
//           <Col xs={24} lg={12}>
//             <Card
//               className="border-0 shadow-xl"
//               style={{
//                 backgroundColor: '#FFFFFF',
//                 borderTop: `4px solid ${theme?.primaryColor || '#008069'}`,
//                 border: `1px solid ${theme?.borderColor || '#E9EDEF'}`,
//               }}
//             >
//               <div className="text-center space-y-6">
//                 <div>
//                   <Title
//                     level={3}
//                     style={{
//                       color: theme?.primaryColor || '#008069',
//                     }}
//                   >
//                     Ready to Get Started?
//                   </Title>
//                   <Paragraph style={{ color: '#6B7280' }}>
//                     {inviteToken
//                       ? 'Complete your registration to join the workspace'
//                       : 'Sign in to access your workspace'}
//                   </Paragraph>
//                 </div>

//                 <Button
//                   type="primary"
//                   size="large"
//                   onClick={handleContinue}
//                   icon={<ArrowRightOutlined />}
//                   style={{
//                     width: '100%',
//                     height: '48px',
//                     fontSize: '16px',
//                     fontWeight: '600',
//                     backgroundColor: theme?.primaryColor || '#008069',
//                     borderColor: theme?.primaryColor || '#008069',
//                   }}
//                 >
//                   {inviteToken ? 'Complete Registration' : 'Sign In'}
//                 </Button>

//                 {inviteToken && (
//                   <Card
//                     className="border-0"
//                     style={{
//                       backgroundColor: `${theme?.primaryColor || '#008069'}08`,
//                     }}
//                   >
//                     <Space direction="vertical" style={{ width: '100%' }}>
//                       <CheckCircleOutlined
//                         style={{
//                           color: '#10B981',
//                           fontSize: '24px',
//                         }}
//                       />
//                       <Text
//                         style={{
//                           color: '#1F2937',
//                           fontWeight: '500',
//                         }}
//                       >
//                         Invitation Valid
//                       </Text>
//                       <Text style={{ color: '#6B7280', fontSize: '14px' }}>
//                         Use the link above to create your account and join
//                       </Text>
//                     </Space>
//                   </Card>
//                 )}

//                 <Divider />

//                 <div>
//                   <Text style={{ color: '#6B7280' }}>
//                     Already have an account?
//                   </Text>
//                   <Button
//                     type="link"
//                     onClick={() => navigate('/login')}
//                     style={{
//                       marginLeft: '8px',
//                       color: theme?.primaryColor || '#008069',
//                       fontWeight: '500',
//                     }}
//                   >
//                     Sign In
//                   </Button>
//                 </div>
//               </div>
//             </Card>

//             {/* Security Info */}
//             <Card
//               className="border-0 mt-4"
//               style={{
//                 backgroundColor: `${theme?.primaryColor || '#008069'}08`,
//                 border: `1px solid ${theme?.borderColor || '#E9EDEF'}`,
//               }}
//             >
//               <div className="flex items-start gap-3">
//                 <LockOutlined
//                   style={{
//                     color: theme?.primaryColor || '#008069',
//                     fontSize: '18px',
//                     marginTop: '2px',
//                     flex: '0 0 auto',
//                   }}
//                 />
//                 <div>
//                   <Text
//                     strong
//                     style={{
//                       color: '#1F2937',
//                       display: 'block',
//                       marginBottom: '4px',
//                     }}
//                   >
//                     Your Data is Secure
//                   </Text>
//                   <Text style={{ color: '#6B7280', fontSize: '14px' }}>
//                     We use industry-standard encryption to protect your
//                     information
//                   </Text>
//                 </div>
//               </div>
//             </Card>
//           </Col>
//         </Row>
//       </div>
//     </div>
//   );
// }
