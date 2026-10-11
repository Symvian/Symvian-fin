// Initial Seed Data matching the 7 relational tables
// 1. USER(User_ID, Full_Name, Email, Phone, Role, Created_At)
// 2. VENUE(Venue_ID, Venue_Name, Location_Address, Total_Capacity, Contact_Email)
// 3. CATEGORY(Category_ID, Category_Name)
// 4. EVENT(Event_ID, Title, Description, Category_ID, Venue_ID, Organizer_ID, Event_Date, Ticket_Price, Max_Capacity, Current_Enrolled, Status, Created_At)
// 5. REGISTRATION(Registration_ID, Event_ID, User_ID, Registration_Status, Waitlist_Position, Registered_At)
// 6. PAYMENT(Payment_ID, Registration_ID, Amount, Payment_Status, Transaction_Reference, Verified_At)
// 7. EVENT_VOLUNTEER(Assignment_ID, Event_ID, User_ID, Assigned_Role)

export const INITIAL_USERS = [
  {
    User_ID: 'usr_soorya',
    Full_Name: 'Soorya H',
    Email: 'soorya@symvian.edu',
    Password: 'symvian',
    Phone: '9876543213',
    Role: 'Volunteer',
    admin_event_ids: [],
    Created_At: '2026-10-09T17:51:52.443Z',
    Avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
  },
  {
    User_ID: 'usr_anirudh',
    Full_Name: 'Anirudh Satish',
    Email: 'anirudh@symvian.edu',
    Password: 'symvian',
    Phone: '9876543210',
    Role: 'Organizer',
    admin_event_ids: [1, 3],
    Created_At: '2026-10-09T17:51:52.443Z',
    Avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
  },
  {
    User_ID: 'usr_devan',
    Full_Name: 'Devanarayanan S M',
    Email: 'devan@symvian.edu',
    Password: 'symvian',
    Phone: '9876543211',
    Role: 'Admin',
    admin_event_ids: [1],
    Created_At: '2026-10-09T17:51:52.443Z',
    Avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80'
  },
  {
    User_ID: 'usr_sriram',
    Full_Name: 'Sriram Ramesh C',
    Email: 'sriram@symvian.edu',
    Password: 'symvian',
    Phone: '9876543212',
    Role: 'Organizer',
    admin_event_ids: [2],
    Created_At: '2026-10-09T17:51:52.443Z',
    Avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
  },
  {
    User_ID: 'usr_001',
    Full_Name: 'Arjun Sharma',
    Email: 'arjun.sharma@amrita.edu',
    Password: 'password123',
    Phone: '+91 98451 23456',
    Role: 'Attendee',
    admin_event_ids: [],
    Created_At: '2026-09-01T10:00:00Z',
    Avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
  },
  {
    User_ID: 'usr_002',
    Full_Name: 'Priya Patel',
    Email: 'priya.patel@amrita.edu',
    Password: 'password123',
    Phone: '+91 98452 34567',
    Role: 'Organizer',
    admin_event_ids: [1, 2, 4],
    Created_At: '2026-09-02T11:30:00Z',
    Avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
  },
  {
    User_ID: 'usr_003',
    Full_Name: 'Devansh Kumar',
    Email: 'devansh.k@amrita.edu',
    Password: 'password123',
    Phone: '+91 98453 45678',
    Role: 'Volunteer',
    admin_event_ids: [],
    Created_At: '2026-09-03T09:15:00Z',
    Avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80'
  },
  {
    User_ID: 'usr_004',
    Full_Name: 'Dr. Meera Iyer',
    Email: 'meera.iyer@amrita.edu',
    Password: 'password123',
    Phone: '+91 98454 56789',
    Role: 'Admin',
    admin_event_ids: [3],
    Created_At: '2026-08-15T08:00:00Z',
    Avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80'
  },
  {
    User_ID: 'usr_005',
    Full_Name: 'Rohan Verma',
    Email: 'rohan.v@amrita.edu',
    Password: 'password123',
    Phone: '+91 98455 67890',
    Role: 'Attendee',
    admin_event_ids: [],
    Created_At: '2026-09-10T14:20:00Z',
    Avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
  },
  {
    User_ID: 'usr_006',
    Full_Name: 'Ananya Nair',
    Email: 'ananya.n@amrita.edu',
    Password: 'password123',
    Phone: '+91 98456 78901',
    Role: 'Attendee',
    Created_At: '2026-09-12T16:45:00Z',
    Avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
  },
  {
    User_ID: 'usr_007',
    Full_Name: 'Karthik Raja',
    Email: 'karthik.r@amrita.edu',
    Password: 'password123',
    Phone: '+91 98457 89012',
    Role: 'Volunteer',
    Created_At: '2026-09-14T12:00:00Z',
    Avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_VENUES = [
  {
    Venue_ID: 'ven_001',
    Venue_Name: 'SVP Indoor Arena',
    Location_Address: 'Amrita Amritapuri Campus, North Block Ground Floor',
    Total_Capacity: 500,
    Contact_Email: 'venues.svp@amritapuri.amrita.edu',
    Image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&auto=format&fit=crop&q=80'
  },
  {
    Venue_ID: 'ven_002',
    Venue_Name: 'Narendra Modi Stadium Hall',
    Location_Address: 'Sports Complex, Amrita Amritapuri Main Pavilion',
    Total_Capacity: 1200,
    Contact_Email: 'stadium.desk@amritapuri.amrita.edu',
    Image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&auto=format&fit=crop&q=80'
  },
  {
    Venue_ID: 'ven_003',
    Venue_Name: 'Dr. APJ Abdul Kalam Auditorium',
    Location_Address: 'Academic Block 3, 2nd Floor',
    Total_Capacity: 350,
    Contact_Email: 'auditorium.kalam@amrita.edu',
    Image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&auto=format&fit=crop&q=80'
  },
  {
    Venue_ID: 'ven_004',
    Venue_Name: 'Alan Turing Computing Lab',
    Location_Address: 'Computer Science Wing, 4th Floor',
    Total_Capacity: 80,
    Contact_Email: 'cs.labs@amrita.edu',
    Image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_CATEGORIES = [
  { Category_ID: 'cat_001', Category_Name: 'Technical' },
  { Category_ID: 'cat_002', Category_Name: 'Cultural' },
  { Category_ID: 'cat_003', Category_Name: 'Hackathon' },
  { Category_ID: 'cat_004', Category_Name: 'Workshop' },
  { Category_ID: 'cat_005', Category_Name: 'Symposium' }
];

export const INITIAL_EVENTS = [
  {
    Event_ID: 'evt_001',
    Title: 'AI & SQL Optimization Summit',
    Description: 'Deep dive into database query optimization, PostgreSQL execution plans, distributed query engines, and AI-accelerated indexing patterns.',
    Category_ID: 'cat_001',
    Venue_ID: 'ven_001',
    Organizer_ID: 'usr_002',
    Event_Date: '2026-10-24T09:30:00',
    Ticket_Price: 250,
    Max_Capacity: 50,
    Current_Enrolled: 48,
    Status: 'Published',
    Created_At: '2026-09-20T10:00:00Z',
    Cover_Image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
    upi_id: 'anirudh@okhdfcbank',
    admin_contact: '9876543210'
  },
  {
    Event_ID: 'evt_002',
    Title: 'Annual Cultural Fest 2026',
    Description: 'A grand celebration featuring music concerts, dance dramas, battle of the bands, literary showcases, and inter-collegiate performances.',
    Category_ID: 'cat_002',
    Venue_ID: 'ven_002',
    Organizer_ID: 'usr_002',
    Event_Date: '2026-11-10T17:00:00',
    Ticket_Price: 0,
    Max_Capacity: 100,
    Current_Enrolled: 100,
    Status: 'Published',
    Created_At: '2026-09-22T14:30:00Z',
    Cover_Image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    upi_id: 'anirudh@okhdfcbank',
    admin_contact: '9876543210'
  },
  {
    Event_ID: 'evt_003',
    Title: 'National 36-Hour Hackathon',
    Description: 'Build next-generation database, cloud, and edge AI applications in 36 continuous hours of hacking with mentors from top tech companies.',
    Category_ID: 'cat_003',
    Venue_ID: 'ven_004',
    Organizer_ID: 'usr_004',
    Event_Date: '2026-11-20T08:00:00',
    Ticket_Price: 500,
    Max_Capacity: 60,
    Current_Enrolled: 35,
    Status: 'Published',
    Created_At: '2026-09-25T11:00:00Z',
    Cover_Image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
    upi_id: 'anirudh@okhdfcbank',
    admin_contact: '9876543210'
  },
  {
    Event_ID: 'evt_004',
    Title: 'Cloud Native & Microservices Workshop',
    Description: 'Hands-on architectural workshop covering Docker, Kubernetes, gRPC, and ACID transactions in distributed cloud storage.',
    Category_ID: 'cat_004',
    Venue_ID: 'ven_003',
    Organizer_ID: 'usr_002',
    Event_Date: '2026-12-05T10:00:00',
    Ticket_Price: 150,
    Max_Capacity: 40,
    Current_Enrolled: 40,
    Status: 'Published',
    Created_At: '2026-09-28T09:00:00Z',
    Cover_Image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    upi_id: 'anirudh@okhdfcbank',
    admin_contact: '9876543210'
  }
];

export const INITIAL_REGISTRATIONS = [
  {
    Registration_ID: 'reg_001',
    Event_ID: 'evt_001',
    User_ID: 'usr_001',
    Registration_Status: 'Enrolled',
    Waitlist_Position: null,
    is_cancelled: false,
    cancellation_reason: null,
    cancelled_by_contact: null,
    notification_read: false,
    Registered_At: '2026-09-25T10:15:00Z'
  },
  {
    Registration_ID: 'reg_002',
    Event_ID: 'evt_001',
    User_ID: 'usr_005',
    Registration_Status: 'Pending_Payment',
    Waitlist_Position: null,
    is_cancelled: false,
    cancellation_reason: null,
    cancelled_by_contact: null,
    notification_read: false,
    Registered_At: '2026-09-26T14:30:00Z'
  },
  {
    Registration_ID: 'reg_003',
    Event_ID: 'evt_002',
    User_ID: 'usr_005',
    Registration_Status: 'Enrolled',
    Waitlist_Position: null,
    is_cancelled: false,
    cancellation_reason: null,
    cancelled_by_contact: null,
    notification_read: false,
    Registered_At: '2026-09-27T09:10:00Z'
  },
  {
    Registration_ID: 'reg_004',
    Event_ID: 'evt_002',
    User_ID: 'usr_001',
    Registration_Status: 'Waitlisted',
    Waitlist_Position: 1,
    is_cancelled: false,
    cancellation_reason: null,
    cancelled_by_contact: null,
    notification_read: false,
    Registered_At: '2026-09-28T18:00:00Z'
  },
  {
    Registration_ID: 'reg_005',
    Event_ID: 'evt_002',
    User_ID: 'usr_006',
    Registration_Status: 'Waitlisted',
    Waitlist_Position: 2,
    is_cancelled: false,
    cancellation_reason: null,
    cancelled_by_contact: null,
    notification_read: false,
    Registered_At: '2026-09-28T19:30:00Z'
  },
  {
    Registration_ID: 'reg_006',
    Event_ID: 'evt_003',
    User_ID: 'usr_001',
    Registration_Status: 'Enrolled',
    Waitlist_Position: null,
    is_cancelled: false,
    cancellation_reason: null,
    cancelled_by_contact: null,
    notification_read: false,
    Registered_At: '2026-09-29T11:00:00Z'
  }
];

export const INITIAL_PAYMENTS = [
  {
    Payment_ID: 'pay_001',
    Registration_ID: 'reg_001',
    Amount: 250,
    Payment_Status: 'Verified',
    Transaction_Reference: 'TXN_SQL_984512',
    Verified_At: '2026-09-25T10:20:00Z'
  },
  {
    Payment_ID: 'pay_002',
    Registration_ID: 'reg_002',
    Amount: 250,
    Payment_Status: 'Pending',
    Transaction_Reference: 'TXN_SQL_348910',
    Verified_At: null
  },
  {
    Payment_ID: 'pay_003',
    Registration_ID: 'reg_006',
    Amount: 500,
    Payment_Status: 'Verified',
    Transaction_Reference: 'TXN_HACK_772184',
    Verified_At: '2026-09-29T11:05:00Z'
  }
];

export const INITIAL_VOLUNTEERS = [
  {
    Assignment_ID: 'asg_001',
    Event_ID: 'evt_001',
    User_ID: 'usr_003',
    Assigned_Role: 'Technical Lead & AV Coordinator'
  },
  {
    Assignment_ID: 'asg_002',
    Event_ID: 'evt_002',
    User_ID: 'usr_003',
    Assigned_Role: 'Stage Manager'
  },
  {
    Assignment_ID: 'asg_003',
    Event_ID: 'evt_002',
    User_ID: 'usr_007',
    Assigned_Role: 'Registration Desk & Crowd Control'
  },
  {
    Assignment_ID: 'asg_004',
    Event_ID: 'evt_003',
    User_ID: 'usr_007',
    Assigned_Role: 'Hospitality & Logistics Coordinator'
  }
];
