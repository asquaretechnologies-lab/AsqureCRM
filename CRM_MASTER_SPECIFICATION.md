# POS Software Company CRM — Master Product & Development Specification

**Document Version:** 1.0  
**Status:** Draft for Development  
**Date:** 20 August 2026  
**Product:** Internal CRM for POS Software Business  
**Primary Objective:** Customer, installation, license, billing, payment, renewal and support management

---

# Table of Contents

# 1. Product Overview
# 2. Business Objectives
# 3. Scope
# 4. User Roles
# 5. Core Concepts
# 6. Information Architecture
# 7. Business Workflows
# 8. Functional Requirements
# 9. ERD
# 10. Database Schema
# 11. Module Specifications
# 12. Screen/UI Specifications
# 13. Dashboard Specifications
# 14. Reports
# 15. Notifications & Automation
# 16. Roles & Permissions
# 17. Audit & Security
# 18. API Requirements
# 19. Non-Functional Requirements
# 20. Validation & Business Rules
# 21. Acceptance Criteria
# 22. Development Phases
# 23. Seed Data
# 24. Antigravity Master Development Prompt

---

# 1. Product Overview

## 1.1 Purpose

The application is an internal CRM and business management platform for a software company that develops and sells POS billing software.

The system must allow the company to manage:

- Leads
- Customers
- Customer contacts
- Business locations/outlets
- POS installations
- Products
- Product plans
- Software licenses
- License renewals
- Invoices
- Payments
- Outstanding balances
- Sales activities
- Follow-ups
- Customer support tickets
- Employees/users
- Reports
- Notifications
- Audit history

The system should provide a complete 360-degree view of every customer.

---

# 2. Business Objectives

## 2.1 Primary Objectives

# 1. Maintain a centralized customer database.
# 2. Track every POS installation.
# 3. Track the license associated with every installation.
# 4. Track license expiry and renewals.
# 5. Track invoices and payments.
# 6. Track outstanding and overdue payments.
# 7. Track customer communication and follow-ups.
# 8. Track support requests.
# 9. Provide management dashboards.
# 10. Reduce manual spreadsheet-based tracking.
# 11. Provide a reliable audit trail.
# 12. Prepare the architecture for future integration with the POS application.

## 2.2 Success Criteria

The CRM should allow an employee to answer the following questions immediately:

- Who is the customer?
- Who is the customer's main contact?
- How many outlets does the customer have?
- How many POS installations are active?
- Which product is installed?
- Which license is active?
- When does the license expire?
- How much has the customer paid?
- How much is outstanding?
- Which invoices are overdue?
- What support issues are open?
- When was the customer last contacted?
- When is the next follow-up?
- Which employee is responsible for the customer?

---

# 3. Scope

## 3.1 In Scope

### Customer Management

- Customer creation
- Customer editing
- Customer search
- Customer classification
- Customer contacts
- Customer notes
- Customer status

### Outlet Management

- Multiple outlets per customer
- Outlet contacts
- Outlet address
- Outlet status

### Installation Management

- Installation registration
- Product assignment
- Installation status
- Installation date
- Software version
- Terminal count
- User count
- Installation history

### License Management

- License creation
- License activation
- License expiry
- License suspension
- License renewal
- License history
- License alerts

### Billing

- Invoices
- Invoice items
- Payments
- Partial payments
- Outstanding balances
- Overdue invoices
- Payment history

### CRM

- Leads
- Sales pipeline
- Activities
- Calls
- Meetings
- Follow-ups
- Notes

### Support

- Support tickets
- Ticket priority
- Ticket assignment
- Ticket status
- Resolution history

### Administration

- Users
- Roles
- Permissions
- Master data
- Audit logs
- System settings

### Reporting

- Customer reports
- Installation reports
- License reports
- Renewal reports
- Invoice reports
- Payment reports
- Outstanding reports
- Support reports
- Sales reports

---

# 4. Out of Scope for V1

The following should be architecturally possible but not mandatory for V1:

- Full accounting system
- Payroll
- Inventory management
- POS transaction synchronization
- Automatic payment gateway reconciliation
- WhatsApp API integration
- Email marketing automation
- AI sales assistant
- Customer self-service portal
- Mobile application
- Remote POS control

These may be implemented in future versions.

---

# 5. User Roles

The initial roles are:

# 1. Super Admin
# 2. Admin
# 3. Management
# 4. Sales
# 5. Accounts
# 6. Support
# 7. Installation Team
# 8. Read Only

---

# 6. Core Business Concepts

The application must clearly distinguish between the following entities.

## 6.1 Customer

A business/company that purchases or uses the POS software.

## 6.2 Contact

A person associated with a customer.

Example:

- Owner
- Manager
- Accountant
- IT Contact

## 6.3 Outlet

A physical branch/store/location belonging to a customer.

## 6.4 Installation

An actual deployment of POS software at an outlet.

## 6.5 License

A license associated with a POS installation.

## 6.6 Invoice

A financial document issued to a customer.

## 6.7 Payment

Money received against an invoice.

## 6.8 Support Ticket

A customer issue or service request.

---

# 7. Information Architecture

```text
CRM
│
├── Dashboard
│
├── Leads
│
├── Customers
│   ├── Customer List
│   ├── Customer Details
│   ├── Contacts
│   ├── Outlets
│   └── Installations
│
├── Products
│   ├── Products
│   └── Plans
│
├── Licenses
│   ├── Active Licenses
│   ├── Expiring Licenses
│   ├── Expired Licenses
│   └── Renewal History
│
├── Billing
│   ├── Invoices
│   ├── Invoice Details
│   ├── Payments
│   └── Outstanding
│
├── Activities
│   ├── Follow-ups
│   ├── Calls
│   ├── Meetings
│   └── Tasks
│
├── Support
│   ├── Tickets
│   └── Ticket Details
│
├── Reports
│
└── Administration
    ├── Users
    ├── Roles
    ├── Permissions
    ├── Master Data
    ├── Settings
    └── Audit Logs

# 8. Business Workflows
## 8.1 Lead to Customer
```text
Lead
 ↓
Contacted
 ↓
Demo Scheduled
 ↓
Demo Completed
 ↓
Quotation
 ↓
Negotiation
 ↓
Won
 ↓
Customer Created
 ↓
Installation
 ↓
License

```
## 8.2 Customer to Installation
```text
Customer
 ↓
Outlet
 ↓
Installation
 ↓
Product
 ↓
License
 ↓
Activation

```
## 8.3 Invoice to Payment
```text
Invoice
 ↓
Payment
 ↓
Outstanding Balance
 ↓
Fully Paid

```
Partial payments must be supported.

## 8.4 License Renewal
```text
Active License
 ↓
60 Days Before Expiry
 ↓
Renewal Reminder
 ↓
30 Days Before Expiry
 ↓
Renewal Follow-up
 ↓
Payment
 ↓
Renew License
 ↓
New Expiry Date

```
## 8.5 Support Workflow
```text
Ticket Created
 ↓
Assigned
 ↓
In Progress
 ↓
Waiting for Customer
 ↓
Resolved
 ↓
Closed

```
# 9. ERD
## 9.1 High-Level ERD
```mermaid
erDiagram

    USERS ||--o{ ACTIVITIES : creates
    USERS ||--o{ TICKETS : assigned
    USERS ||--o{ AUDIT_LOGS : creates

    LEADS }o--|| USERS : assigned_to
    LEADS ||--o| CUSTOMERS : converts_to

    CUSTOMERS ||--o{ CONTACTS : has
    CUSTOMERS ||--o{ OUTLETS : owns
    CUSTOMERS ||--o{ INVOICES : receives
    CUSTOMERS ||--o{ ACTIVITIES : has
    CUSTOMERS ||--o{ TICKETS : creates

    OUTLETS ||--o{ INSTALLATIONS : contains

    PRODUCTS ||--o{ PRODUCT_PLANS : has
    PRODUCTS ||--o{ INSTALLATIONS : used_by

    INSTALLATIONS ||--o{ LICENSES : has
    LICENSES ||--o{ LICENSE_RENEWALS : renewed_by

    INVOICES ||--o{ INVOICE_ITEMS : contains
    INVOICES ||--o{ PAYMENTS : receives

    PRODUCTS ||--o{ INVOICE_ITEMS : billed_as

    TICKETS ||--o{ TICKET_COMMENTS : contains

    USERS ||--o{ PAYMENTS : records
    USERS ||--o{ INVOICES : creates

# 10. Database Schema
The implementation database may use PostgreSQL, MySQL or another relational database.

PostgreSQL is preferred.

## 10.1 users
| Field | Type | Required | Description |
|---|---|---|---|
| id | UUID | Yes | Primary key |
| employee_code | VARCHAR(50) | Yes | Employee identifier |
| name | VARCHAR(150) | Yes | Full name |
| email | VARCHAR(255) | Yes | Login email |
| phone | VARCHAR(30) | No | Phone |
| password_hash | TEXT | Yes | Password hash |
| role_id | UUID | Yes | Role |
| status | VARCHAR(30) | Yes | ACTIVE/INACTIVE |
| last_login_at | TIMESTAMP | No | Last login |
| created_at | TIMESTAMP | Yes | Created timestamp |
| updated_at | TIMESTAMP | Yes | Updated timestamp |

## 10.2 roles
| Field | Type | Required |
|---|---|---|
| id | UUID | Yes |
| name | VARCHAR(100) | Yes |
| description | TEXT | No |
| status | VARCHAR(30) | Yes |
| created_at | TIMESTAMP | Yes |
| updated_at | TIMESTAMP | Yes |

## 10.3 permissions
| Field | Type | Required |
|---|---|---|
| id | UUID | Yes |
| module | VARCHAR(100) | Yes |
| action | VARCHAR(50) | Yes |
| description | TEXT | No |

Actions:

VIEW
CREATE
EDIT
DELETE
APPROVE
EXPORT

## 10.4 role_permissions
| Field | Type | Required |
|---|---|---|
| role_id | UUID | Yes |
| permission_id | UUID | Yes |

Composite primary key:

(role_id, permission_id)

# 11. customers
| Field | Type | Required |
|---|---|---|
| id | UUID | Yes |
| customer_code | VARCHAR(50) | Yes |
| business_name | VARCHAR(255) | Yes |
| display_name | VARCHAR(255) | Yes |
| customer_type | VARCHAR(50) | No |
| business_type | VARCHAR(100) | No |
| phone | VARCHAR(30) | No |
| email | VARCHAR(255) | No |
| whatsapp | VARCHAR(30) | No |
| website | VARCHAR(255) | No |
| tax_number | VARCHAR(100) | No |
| address_line1 | VARCHAR(255) | No |
| address_line2 | VARCHAR(255) | No |
| city | VARCHAR(100) | No |
| state | VARCHAR(100) | No |
| country | VARCHAR(100) | No |
| postal_code | VARCHAR(20) | No |
| sales_user_id | UUID | No |
| status | VARCHAR(30) | Yes |
| source | VARCHAR(100) | No |
| notes | TEXT | No |
| created_at | TIMESTAMP | Yes |
| updated_at | TIMESTAMP | Yes |

Customer status:

PROSPECT
ACTIVE
INACTIVE
SUSPENDED
CLOSED

# 12. contacts
| Field | Type | Required |
|---|---|---|
| id | UUID | Yes |
| customer_id | UUID | Yes |
| name | VARCHAR(150) | Yes |
| designation | VARCHAR(100) | No |
| phone | VARCHAR(30) | No |
| whatsapp | VARCHAR(30) | No |
| email | VARCHAR(255) | No |
| contact_type | VARCHAR(50) | No |
| is_primary | BOOLEAN | Yes |
| notes | TEXT | No |
| created_at | TIMESTAMP | Yes |
| updated_at | TIMESTAMP | Yes |

# 13. outlets
| Field | Type | Required |
|---|---|---|
| id | UUID | Yes |
| customer_id | UUID | Yes |
| outlet_code | VARCHAR(50) | Yes |
| outlet_name | VARCHAR(255) | Yes |
| address_line1 | VARCHAR(255) | No |
| address_line2 | VARCHAR(255) | No |
| city | VARCHAR(100) | No |
| state | VARCHAR(100) | No |
| country | VARCHAR(100) | No |
| postal_code | VARCHAR(20) | No |
| contact_person | VARCHAR(150) | No |
| phone | VARCHAR(30) | No |
| email | VARCHAR(255) | No |
| status | VARCHAR(30) | Yes |
| opening_date | DATE | No |
| notes | TEXT | No |
| created_at | TIMESTAMP | Yes |
| updated_at | TIMESTAMP | Yes |

# 14. products
| Field | Type | Required |
|---|---|---|
| id | UUID | Yes |
| product_code | VARCHAR(50) | Yes |
| name | VARCHAR(150) | Yes |
| description | TEXT | No |
| version | VARCHAR(50) | No |
| status | VARCHAR(30) | Yes |
| created_at | TIMESTAMP | Yes |
| updated_at | TIMESTAMP | Yes |

# 15. product_plans
| Field | Type | Required |
|---|---|---|
| id | UUID | Yes |
| product_id | UUID | Yes |
| plan_code | VARCHAR(50) | Yes |
| name | VARCHAR(150) | Yes |
| billing_period | VARCHAR(30) | Yes |
| price | DECIMAL(14,2) | Yes |
| max_terminals | INTEGER | No |
| max_users | INTEGER | No |
| description | TEXT | No |
| status | VARCHAR(30) | Yes |
| created_at | TIMESTAMP | Yes |
| updated_at | TIMESTAMP | Yes |

Billing periods:

MONTHLY
QUARTERLY
HALF_YEARLY
YEARLY
LIFETIME

# 16. installations
| Field | Type | Required |
|---|---|---|
| id | UUID | Yes |
| installation_number | VARCHAR(50) | Yes |
| customer_id | UUID | Yes |
| outlet_id | UUID | Yes |
| product_id | UUID | Yes |
| installation_date | DATE | No |
| activation_date | DATE | No |
| version | VARCHAR(50) | No |
| terminal_count | INTEGER | Yes |
| user_count | INTEGER | Yes |
| server_type | VARCHAR(50) | No |
| server_name | VARCHAR(255) | No |
| installed_by | UUID | No |
| status | VARCHAR(30) | Yes |
| last_activity_at | TIMESTAMP | No |
| notes | TEXT | No |
| created_at | TIMESTAMP | Yes |
| updated_at | TIMESTAMP | Yes |

Installation statuses:

PLANNED
SCHEDULED
INSTALLED
ACTIVE
SUSPENDED
MAINTENANCE
DEACTIVATED
UNINSTALLED

# 17. licenses
| Field | Type | Required |
|---|---|---|
| id | UUID | Yes |
| license_number | VARCHAR(100) | Yes |
| license_key | VARCHAR(255) | Yes |
| customer_id | UUID | Yes |
| installation_id | UUID | Yes |
| product_id | UUID | Yes |
| plan_id | UUID | No |
| license_type | VARCHAR(50) | Yes |
| start_date | DATE | Yes |
| expiry_date | DATE | Yes |
| terminal_count | INTEGER | Yes |
| user_count | INTEGER | Yes |
| price | DECIMAL(14,2) | No |
| discount | DECIMAL(14,2) | No |
| tax | DECIMAL(14,2) | No |
| total_amount | DECIMAL(14,2) | No |
| status | VARCHAR(30) | Yes |
| auto_renew | BOOLEAN | Yes |
| issued_by | UUID | Yes |
| notes | TEXT | No |
| created_at | TIMESTAMP | Yes |
| updated_at | TIMESTAMP | Yes |

License statuses:

DRAFT
ACTIVE
EXPIRING
EXPIRED
SUSPENDED
CANCELLED
REVOKED

# 18. license_renewals
| Field | Type | Required |
|---|---|---|
| id | UUID | Yes |
| license_id | UUID | Yes |
| previous_expiry_date | DATE | Yes |
| new_expiry_date | DATE | Yes |
| invoice_id | UUID | No |
| amount | DECIMAL(14,2) | Yes |
| renewed_by | UUID | Yes |
| renewal_date | DATE | Yes |
| notes | TEXT | No |
| created_at | TIMESTAMP | Yes |

# 19. invoices
| Field | Type | Required |
|---|---|---|
| id | UUID | Yes |
| invoice_number | VARCHAR(50) | Yes |
| customer_id | UUID | Yes |
| outlet_id | UUID | No |
| installation_id | UUID | No |
| invoice_date | DATE | Yes |
| due_date | DATE | Yes |
| invoice_type | VARCHAR(50) | Yes |
| subtotal | DECIMAL(14,2) | Yes |
| discount | DECIMAL(14,2) | Yes |
| tax | DECIMAL(14,2) | Yes |
| total_amount | DECIMAL(14,2) | Yes |
| amount_paid | DECIMAL(14,2) | Yes |
| balance_amount | DECIMAL(14,2) | Yes |
| status | VARCHAR(30) | Yes |
| created_by | UUID | Yes |
| notes | TEXT | No |
| created_at | TIMESTAMP | Yes |
| updated_at | TIMESTAMP | Yes |

Invoice statuses:

DRAFT
ISSUED
PARTIALLY_PAID
PAID
OVERDUE
CANCELLED

# 20. invoice_items
| Field | Type | Required |
|---|---|---|
| id | UUID | Yes |
| invoice_id | UUID | Yes |
| product_id | UUID | No |
| description | VARCHAR(500) | Yes |
| quantity | DECIMAL(12,2) | Yes |
| unit_price | DECIMAL(14,2) | Yes |
| discount | DECIMAL(14,2) | Yes |
| tax | DECIMAL(14,2) | Yes |
| total | DECIMAL(14,2) | Yes |

# 21. payments
| Field | Type | Required |
|---|---|---|
| id | UUID | Yes |
| receipt_number | VARCHAR(50) | Yes |
| invoice_id | UUID | Yes |
| customer_id | UUID | Yes |
| payment_date | DATE | Yes |
| amount | DECIMAL(14,2) | Yes |
| payment_method | VARCHAR(50) | Yes |
| reference_number | VARCHAR(150) | No |
| bank_name | VARCHAR(150) | No |
| collected_by | UUID | Yes |
| notes | TEXT | No |
| created_at | TIMESTAMP | Yes |

# 22. leads
| Field | Type | Required |
|---|---|---|
| id | UUID | Yes |
| lead_number | VARCHAR(50) | Yes |
| company_name | VARCHAR(255) | Yes |
| contact_name | VARCHAR(150) | Yes |
| phone | VARCHAR(30) | No |
| email | VARCHAR(255) | No |
| city | VARCHAR(100) | No |
| business_type | VARCHAR(100) | No |
| source | VARCHAR(100) | No |
| product_id | UUID | No |
| expected_value | DECIMAL(14,2) | No |
| expected_close_date | DATE | No |
| assigned_to | UUID | No |
| status | VARCHAR(50) | Yes |
| probability | INTEGER | No |
| notes | TEXT | No |
| created_at | TIMESTAMP | Yes |
| updated_at | TIMESTAMP | Yes |

# 23. activities
| Field | Type | Required |
|---|---|---|
| id | UUID | Yes |
| customer_id | UUID | No |
| lead_id | UUID | No |
| contact_id | UUID | No |
| user_id | UUID | Yes |
| activity_type | VARCHAR(50) | Yes |
| subject | VARCHAR(255) | Yes |
| activity_date | TIMESTAMP | Yes |
| outcome | TEXT | No |
| next_followup_date | TIMESTAMP | No |
| status | VARCHAR(30) | Yes |
| notes | TEXT | No |
| created_at | TIMESTAMP | Yes |
| updated_at | TIMESTAMP | Yes |

Activity types:

CALL
WHATSAPP
EMAIL
MEETING
DEMO
SITE_VISIT
PAYMENT_FOLLOWUP
RENEWAL_FOLLOWUP
SUPPORT_FOLLOWUP
TASK
OTHER

# 24. tickets
| Field | Type | Required |
|---|---|---|
| id | UUID | Yes |
| ticket_number | VARCHAR(50) | Yes |
| customer_id | UUID | Yes |
| outlet_id | UUID | No |
| installation_id | UUID | No |
| contact_id | UUID | No |
| subject | VARCHAR(255) | Yes |
| description | TEXT | Yes |
| category | VARCHAR(100) | Yes |
| priority | VARCHAR(30) | Yes |
| assigned_to | UUID | No |
| status | VARCHAR(30) | Yes |
| created_at | TIMESTAMP | Yes |
| first_response_at | TIMESTAMP | No |
| resolved_at | TIMESTAMP | No |
| closed_at | TIMESTAMP | No |
| resolution_notes | TEXT | No |
| updated_at | TIMESTAMP | Yes |

# 25. ticket_comments
| Field | Type | Required |
|---|---|---|
| id | UUID | Yes |
| ticket_id | UUID | Yes |
| user_id | UUID | Yes |
| comment | TEXT | Yes |
| created_at | TIMESTAMP | Yes |

# 26. audit_logs
| Field | Type | Required |
|---|---|---|
| id | UUID | Yes |
| user_id | UUID | No |
| entity_type | VARCHAR(100) | Yes |
| entity_id | UUID | Yes |
| action | VARCHAR(50) | Yes |
| old_values | JSONB | No |
| new_values | JSONB | No |
| ip_address | VARCHAR(100) | No |
| created_at | TIMESTAMP | Yes |

# 27. system_settings
| Field | Type | Required |
|---|---|---|
| id | UUID | Yes |
| key | VARCHAR(150) | Yes |
| value | TEXT | No |
| description | TEXT | No |
| updated_by | UUID | No |
| updated_at | TIMESTAMP | Yes |

# 28. Database Rules
## 28.1 Customer Relationships
Customer 1 → N Contacts
Customer 1 → N Outlets
Customer 1 → N Invoices
Customer 1 → N Activities
Customer 1 → N Tickets

## 28.2 Outlet Relationships
Outlet 1 → N Installations

## 28.3 Installation Relationships
Installation 1 → N Licenses

Historical licenses must never be deleted when a license is renewed.

## 28.4 Invoice Relationships
Invoice 1 → N Invoice Items
Invoice 1 → N Payments

Partial payment must be supported.

# 29. Module-by-Module Functional Specification
## 29.1 Authentication
Features:

Login
Logout
Password hashing
Password reset
Session management
Role-based authorization
Requirements:

Never store plain-text passwords.
Use secure password hashing.
Protect all authenticated APIs.
Enforce permission checks on the server.
## 29.2 Customer Management
Features:

Customer list
Create customer
Edit customer
View customer
Archive/deactivate customer
Search
Filters
Export
Customer 360
Search fields:

Customer code
Business name
Phone
Email
Tax number
City
Contact name
## 29.3 Contact Management
Users can:

Add contacts
Edit contacts
Mark primary contact
Record designation
Record communication details
View activity history
## 29.4 Outlet Management
Users can:

Create outlet
Edit outlet
View installations
Assign contacts
Change outlet status
## 29.5 Installation Management
Users can:

Register installation
Assign product
Assign outlet
Set terminal count
Set user count
Record version
Assign installer
Activate installation
Suspend installation
Deactivate installation

Installation number must be unique.

## 29.6 Product Management
Admin can:

Create product
Edit product
Activate/deactivate product
Create plans
Configure pricing

## 29.7 License Management
Features:

Create license
Generate license number
Generate license key
Activate
Suspend
Revoke
Renew
View history
Filter by expiry

The system must prevent more than one active license for an installation unless explicitly configured.

## 29.8 License Renewal
The system must identify licenses approaching expiry.

Default thresholds:
60 days
30 days
15 days
7 days
1 day
Expired

Renewal must:

Identify license.
Display current expiry.
Select renewal plan.
Calculate amount.
Create invoice.
Record payment.
Renew license.
Update expiry.
Record renewal history.
Create audit log.

## 29.9 Invoice Management
Features:

Create invoice
Add invoice items
Calculate subtotal
Apply discount
Calculate tax
Calculate total
Set due date
Record payment
Cancel invoice
Print/download invoice

## 29.10 Payment Management
Features:

Record payment
Partial payment
Full payment
Payment reference
Payment method
Receipt number
Payment history

After payment:
Balance = Invoice Total - Sum(Payments)

Invoice status must update automatically.

## 29.11 Outstanding Management
Provide:

Customer-wise outstanding
Invoice-wise outstanding
Due today
Due this week
Overdue
Aging

Suggested aging:
Current
1–7 Days
8–30 Days
31–60 Days
61–90 Days
90+ Days

## 29.12 Lead Management
Pipeline:
NEW
CONTACTED
DEMO_SCHEDULED
DEMO_COMPLETED
QUOTATION_SENT
NEGOTIATION
WON
LOST

When a lead is won:

Create customer
Create primary contact
Preserve lead history
Link lead to customer

## 29.13 Activities

Users can create:

Call
Meeting
Demo
Site visit
Follow-up
Payment follow-up
Renewal follow-up
Task

Every activity should support a next follow-up date.

## 29.14 Support Tickets
Features:

Create ticket
Assign ticket
Change priority
Add comments
Change status
Resolve
Close
Search/filter
Customer ticket history

## 29.15 Reports
Reports must support:

Search
Filters
Date range
Sorting
Pagination
CSV export
Excel export where supported
PDF/print where appropriate

# 30. Screen/UI Specification
The UI should be modern, clean, responsive and optimized for desktop business use.

Preferred layout:
```text
┌──────────────────────────────────────────────┐
│ Top Bar                                      │
├────────────┬─────────────────────────────────┤
│            │                                 │
│ Sidebar    │ Main Content                    │
│            │                                 │
│            │                                 │
│            │                                 │
└────────────┴─────────────────────────────────┘

```
# 31. Login Screen
Elements:

Company logo
Email
Password
Remember me
Login
Forgot password

# 32. Main Dashboard
Cards:
Total Customers
Active Installations
Active Licenses
Expiring Licenses
Monthly Revenue
Outstanding
Overdue
Open Tickets

Charts:

Revenue trend
Customer growth
License expiry
Sales pipeline
Outstanding aging

Tables:

Today's follow-ups
Upcoming renewals
Overdue invoices
Critical support tickets

# 33. Customer List
Columns:
Customer Code
Business Name
Primary Contact
Phone
City
Outlets
Installations
Active Licenses
Outstanding
Status
Actions

Actions:
- View
- Edit
- Add Outlet
- Add Installation
- Create Invoice
- Add Payment

Filters:

Status
Sales person
City
Business type
License status
Outstanding status

# 34. Customer 360 Screen
Header:
Customer Name
Customer Code
Status
Sales Owner
Phone
Email

Summary cards:
Outlets
Installations
Active Licenses
Outstanding
Open Tickets

Tabs:
Overview
Contacts
Outlets
Installations
Licenses
Invoices
Payments
Tickets
Activities
Notes
Audit

# 35. Installation Screen
Header:
Installation Number
Customer
Outlet
Product
Status

Information:
Installation Date
Activation Date
Software Version
Terminal Count
User Count
Server
Installer
Last Activity

Related:
Active License
License History
Invoices
Support Tickets

# 36. License Screen
Columns:
License Number
Customer
Installation
Product
Plan
Start Date
Expiry Date
Days Remaining
Status
Amount
Actions

Actions:
- View
- Renew
- Suspend
- Revoke
- Print

Use visual indicators:
Green  = Active
Orange = Expiring Soon
Red    = Expired
Gray   = Suspended/Cancelled

# 37. Invoice Screen
Columns:
Invoice Number
Customer
Invoice Date
Due Date
Total
Paid
Balance
Status
Actions

# 38. Payment Screen
Columns:
Receipt Number
Invoice
Customer
Payment Date
Amount
Method
Reference
Collected By

# 39. Support Screen
Columns:
Ticket Number
Customer
Subject
Priority
Assigned To
Status
Created
Updated

Use priority colors:
Critical = Red
High = Orange
Medium = Yellow
Low = Gray/Blue

# 40. Mobile Responsiveness
The application should work on:

Desktop
Laptop
Tablet
Mobile

Priority should be desktop-first because this is an internal business application.

# 41. Navigation

Recommended sidebar:
Dashboard

Sales
  Leads
  Activities

Customers
  Customers
  Outlets
  Installations

Licensing
  Licenses
  Renewals

Billing
  Invoices
  Payments
  Outstanding

Support
  Tickets

Reports

Administration
  Users
  Roles
  Products
  Plans
  Master Data
  Settings
  Audit Logs

# 42. Dashboard Specifications

## Management Dashboard
Metrics:
Total Customers
New Customers
Active Installations
Active Licenses
Expiring Licenses
Expired Licenses
Monthly Revenue
Outstanding
Overdue
Open Tickets

## Sales Dashboard
New Leads
Open Leads
Demos
Quotations
Won
Lost
Expected Revenue
Today's Follow-ups

##Accounts Dashboard
Invoices
Payments
Today's Collection
Monthly Collection
Outstanding
Overdue
Aging

##Support Dashboard
Open Tickets
Critical Tickets
Unassigned Tickets
My Tickets
Resolved Today
Average Resolution Time

# 43. Reports

##Customer Reports
Customer master
New customers
Active customers
Inactive customers
Customers by location
Customers by business type

##Installation Reports
Installation master
Active installations
Inactive installations
Installations by product
Installations by installer

##License Reports
Active licenses
Expiring licenses
Expired licenses
Renewal history
License revenue

##Finance Reports
Sales
Invoices
Payments
Outstanding
Overdue
Collection
Aging

##Sales Reports
Leads
Pipeline
Won/Lost
Salesperson performance
Expected revenue

##Support Reports
Ticket volume
Tickets by category
Tickets by priority
Tickets by employee
Resolution time

# 44. Notifications & Automation
The system should support an internal notification engine.

##License Notifications
Generate notifications at:
60 days
30 days
15 days
7 days
1 day
Expiry

##Payment Notifications
Generate:
Invoice due soon
Invoice due today
Invoice overdue
Partial payment
Payment received

##Follow-up Notifications
Generate:
Follow-up due today
Follow-up overdue
Demo reminder
Renewal follow-up
Payment collection reminder

V1 can implement in-app notifications.

Email/WhatsApp integration can be added later.

# 45. Roles & Permissions

## Super Admin
Full access.

## Admin
Full operational access except sensitive system configuration.

## Management
Read access to all business data and reports.

## Sales
Access:

Leads
Customers
Contacts
Activities
Limited license information
Sales reports

## Accounts
Access:

Customers
Invoices
Payments
Outstanding
Financial reports
Licenses

## Support
Access:

Customers
Outlets
Installations
Licenses
Tickets
Support reports

## Installation Team
Access:

Customers
Outlets
Installations
Installation updates

## Read Only
View-only access.

# 46. Security Requirements

## Authentication
Secure authentication
Password hashing
Session/token security
Logout
Password reset

## Authorization
Every API endpoint must enforce server-side permissions.

Never rely only on frontend permissions.

## Audit
Record:

Create
Update
Delete
License changes
Payment changes
Invoice changes
Permission changes
User changes

# 47. Data Protection

Sensitive information must not be exposed unnecessarily.
The application must:

Validate all input.
Sanitize user-generated content.
Prevent SQL injection.
Prevent unauthorized access.
Protect API endpoints.
Avoid exposing passwords or secrets in logs.
Avoid storing plain-text passwords.
Use environment variables for secrets.

# 48. API Requirements
Use REST APIs or another clearly documented API architecture.
Example:
/api/auth
/api/users
/api/roles
/api/customers
/api/contacts
/api/outlets
/api/installations
/api/products
/api/plans
/api/licenses
/api/renewals
/api/invoices
/api/payments
/api/leads
/api/activities
/api/tickets
/api/reports
/api/notifications
/api/settings
/api/audit-logs

# 49. API Design Rules
All APIs should:

Validate input
Return consistent response structures
Return proper HTTP status codes
Enforce permissions
Support pagination
Support filtering
Support sorting
Return useful error messages
Log unexpected errors

Example success response:
{
  "success": true,
  "data": {},
  "message": "Customer created successfully"
}

Example error:
{
  "success": false,
  "error": {
    "code": "CUSTOMER_NOT_FOUND",
    "message": "Customer was not found"
  }
}

# 50. Pagination
List APIs should support:
page
limit
sort
order
search
filters

Example:
GET /api/customers?page=1&limit=25&search=ABC

# 51. Non-Functional Requirements
## Performance
Target:

Normal pages < 2 seconds
API responses < 1 second for normal queries
Paginated lists
Database indexes for frequent searches

## Scalability
The system should be capable of supporting:
100,000+ customers
500,000+ installations
1,000,000+ invoices
1,000,000+ payments

without major architectural changes.

## Reliability
Database backups
Error logging
Transactional financial operations
No duplicate payment recording
No inconsistent invoice balances

# 52. Database Indexing
Recommended indexes:
customers.customer_code
customers.business_name
customers.phone
customers.email

outlets.customer_id
outlets.outlet_code

installations.installation_number
installations.customer_id
installations.outlet_id
installations.status

licenses.license_number
licenses.license_key
licenses.customer_id
licenses.installation_id
licenses.expiry_date
licenses.status

invoices.invoice_number
invoices.customer_id
invoices.due_date
invoices.status

payments.receipt_number
payments.invoice_id
payments.customer_id
payments.payment_date

tickets.ticket_number
tickets.customer_id
tickets.status
tickets.assigned_to

# 53. Transaction Rules
Financial operations must use database transactions.

For example, recording a payment should atomically:
Create payment.
Calculate total payments.
Update invoice paid amount.
Update invoice balance.
Update invoice status.
Create audit record.

If any operation fails, the entire transaction must roll back

# 54. Business Rules

## Customer
Customer code must be unique.

## Outlet
Outlet code should be unique within a customer.

## Installation
Installation number must be globally unique.

## License
License number must be globally unique.

License key must be unique.

## Active License
Only one active license per installation unless the product configuration explicitly allows multiple licenses.

## Invoice
Invoice number must be unique.

## Payment
Receipt number must be unique.

Payment cannot exceed invoice balance unless overpayment is explicitly supported.

# 55. License Expiry Calculation
Days remaining:
days_remaining = expiry_date - current_date

Status rules:
days_remaining < 0
→ EXPIRED

days_remaining <= 7
→ EXPIRING

days_remaining <= 30
→ EXPIRING

days_remaining > 30
→ ACTIVE

The exact status model should use the configured thresholds.

# 56. Invoice Balance Calculation
subtotal
- discount
+ tax
= total_amount

total_amount
- sum(payments)
= balance_amount

Invoice status:
balance = total
→ ISSUED

0 < balance < total
→ PARTIALLY_PAID

balance = 0
→ PAID

balance > 0 AND due_date < today
→ OVERDUE

# 57. Acceptance Criteria
## Customer
User can create customer.
Customer code is unique.
User can edit customer.
User can search customer.
User can view customer 360.

## Outlet
User can create multiple outlets.
Each outlet belongs to one customer.
User can view installations for outlet.

## Installation
User can create installation.
Installation belongs to customer and outlet.
Product must be selected.
Installation number must be unique.

## License
User can create license.
License belongs to installation.
License key is unique.
Expiry date is mandatory.
Expiring licenses appear in dashboard.

## Invoice
User can create invoice.
Invoice totals are calculated correctly.
Invoice number is unique.

## Payment
User can record partial payment.
Balance updates automatically.
Invoice becomes PAID when balance reaches zero.
Payment history is preserved.

## Renewal
User can renew license.
Previous license history remains available.
New expiry is calculated correctly.
Renewal is recorded.

## Support
User can create ticket.
Ticket can be assigned.
Ticket status can be changed.
Ticket history is preserved.

## Audit
Important changes create audit records.

# 58. Development Phases

## Phase 1 — Foundation
Authentication
Users
Roles
Permissions
Settings
Audit Logs
Database
API foundation

## Phase 2 — Customer Core
Customers
Contacts
Outlets
Installations
Customer 360

## Phase 3 — Products & Licensing
Products
Plans
Licenses
Activation
Expiry
Renewals

## Phase 4 — Billing
Invoices
Invoice Items
Payments
Outstanding
Aging

## Phase 5 — CRM
Leads
Activities
Follow-ups
Sales Pipeline

## Phase 6 — Support
Tickets
Comments
Assignments
Resolution

## Phase 7 — Reporting
Dashboards
Reports
Exports
Notifications

# 59. Seed Data
The development environment should include sample data.

## Users
admin@example.com
manager@example.com
sales@example.com
accounts@example.com
support@example.com
installer@example.com

Use development-only passwords and clearly mark them as seed credentials.

## Products
Example:
POS Billing
POS Enterprise
POS Restaurant
POS Retail

These are placeholder seed values and must be replaced with actual company products.

## Sample Customers
Create at least:
10 customers
20 outlets
25 installations
30 licenses
20 invoices
25 payments
10 leads
15 activities
10 tickets

Use realistic relationships between records.

# 60. Testing Strategy
## Unit Tests
Test:

Calculations
Validation
License expiry
Invoice totals
Payment balance
Permissions

## Integration Tests
Test:

Customer → Outlet
Outlet → Installation
Installation → License
Invoice → Payment
License → Renewal
Customer → Ticket

# End-to-End Tests
Test complete workflows:

Lead
→ Customer
→ Outlet
→ Installation
→ License
→ Invoice
→ Payment
→ Renewal

# 61. Antigravity Master Development Prompt
The following section is intended to be provided to Google's Antigravity as the master development instruction.

## MASTER PROMPT
You are the lead software architect and senior full-stack engineer responsible for building an internal CRM for a software company that develops and sells POS billing software.

The attached/project specification is the authoritative product specification.

Build the application incrementally and production-quality.

Do not simplify the business model into a generic CRM.

The most important business relationships are:
Customer
  ↓
Outlet
  ↓
Installation
  ↓
License
  ↓
Renewal

and:

Customer
  ↓
Invoice
  ↓
Payment

and:

Customer
  ↓
Support Ticket

## 61.1 Development Principles
Follow these principles:

Build the system modularly.
Keep frontend, backend and database responsibilities separated.
Use strong typing where supported.
Use reusable UI components.
Use reusable form components.
Use reusable table components.
Implement server-side authorization.
Never trust frontend permissions.
Validate all inputs.
Use database transactions for financial operations.
Preserve historical records.
Do not hard-delete important financial or licensing history.
Create audit records for important changes.
Use proper database indexes.
Avoid unnecessary duplication.
Keep business logic in service/domain layers rather than UI components.
Do not hard-code business configuration.
Use environment variables for secrets.
Create automated tests for critical business logic.
Keep the application maintainable.

# 62. Implementation Order
Implement in this exact sequence unless a dependency requires otherwise.

## Step 1
Project foundation:
Repository
Environment configuration
Database
Migration system
Backend
Frontend
Authentication
Error handling
Logging

## Step 2
RBAC:
Users
Roles
Permissions
Authorization middleware

## Step 3
Customer core:
Customers
Contacts
Outlets

## Step 4
Installations:
Products
Installations
Installation status

## Step 5
Licensing:
Plans
Licenses
Expiry
Renewals

## Step 6
Finance:
Invoices
Invoice Items
Payments
Outstanding
Aging

# Step 7
CRM:
Leads
Activities
Follow-ups

## Step 8
Support:
Tickets
Comments
Assignments

## Step 9
Dashboards:
Management
Sales
Accounts
Support

## Step 10
Reports and exports.

## Step 11
Notifications.

## Step 12
Final QA and security review.

#63. UI Requirements for Antigravity
Create a professional SaaS-style business interface.

Use:

Sidebar navigation
Top navigation
Breadcrumbs
Data tables
Filters
Search
Pagination
Modal/dialog forms where appropriate
Drawer panels where appropriate
Confirmation dialogs
Toast notifications
Status badges
Summary cards
Charts
Empty states
Loading states
Error states

Do not create overly decorative UI
Prioritize:
Clarity
Speed
Consistency
Readability
Business usability

# 64. Form Requirements
All forms must:

Have labels.
Clearly indicate required fields.
Validate input.
Show useful validation errors.
Prevent duplicate submissions.
Preserve entered data when possible.
Display success/error feedback.

For financial forms, show calculated values before submission.

# 65. Table Requirements
All major tables should support:

Search
Filter
Sort
Pagination
Column visibility where useful
Export where authorized

Tables must remain usable with large datasets.

# 66. Customer 360 Requirement
Customer 360 is a critical feature.

When a customer is opened, display:
Customer Information
Contacts
Outlets
Installations
Licenses
Invoices
Payments
Outstanding
Support Tickets
Activities
Notes
Audit History

The user should not need to navigate through multiple unrelated screens to understand the customer's current status.

# 67. License Management Requirement
License management is a core feature.

The system must make it easy to answer:
Which customer owns this license?
Which outlet?
Which installation?
Which product?
Which plan?
When activated?
When expires?
How many terminals?
How many users?
Is it active?
Has it been renewed?
What invoices/payments are associated?

License history must never be lost.

# 68. Finance Requirement
Financial calculations must be deterministic and server-side.

Never rely exclusively on frontend calculations.

The backend must calculate:
Invoice total
Paid amount
Balance
Invoice status
Outstanding
Overdue

Use database transactions for payment processing.

# 69. Audit Requirement
Create audit records for:
Customer creation/update
Installation changes
License creation
License activation
License renewal
License suspension
License cancellation
Invoice creation/update
Payment creation
Payment modification
User creation/update
Role changes
Permission changes
Important configuration changes

# 70. Error Handling
Use standardized errors.

Examples:
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
DUPLICATE_RECORD
INVALID_OPERATION
PAYMENT_EXCEEDS_BALANCE
ACTIVE_LICENSE_EXISTS
LICENSE_EXPIRED
INTERNAL_SERVER_ERROR

Never expose stack traces or sensitive implementation details to end users.

# 71. Empty States
Every list page must have a useful empty state.

Example:
No customers found.

[ Add Customer ]

For filtered results:
No customers match your current filters.

[ Clear Filters ]

# 72. Confirmation Requirements
Require confirmation for destructive or high-impact operations:
Delete
Deactivate
Suspend License
Revoke License
Cancel Invoice
Close Customer

The confirmation should clearly explain the impact.

# 73. Development Quality Gate
Before marking a module complete, verify:

[ ] Database migration works
[ ] API works
[ ] Authorization works
[ ] Validation works
[ ] UI works
[ ] Loading state exists
[ ] Empty state exists
[ ] Error state exists
[ ] Audit logging works where required
[ ] Tests exist
[ ] No console errors
[ ] No obvious security issues

# 74. Final QA Checklist
Before declaring V1 complete:

[ ] Login works
[ ] Logout works
[ ] RBAC works
[ ] Customer CRUD works
[ ] Contact CRUD works
[ ] Outlet CRUD works
[ ] Installation CRUD works
[ ] Product management works
[ ] Plan management works
[ ] License creation works
[ ] License activation works
[ ] License expiry works
[ ] License renewal works
[ ] Invoice creation works
[ ] Invoice calculation works
[ ] Payment recording works
[ ] Partial payment works
[ ] Outstanding calculation works
[ ] Overdue calculation works
[ ] Lead management works
[ ] Activities work
[ ] Follow-ups work
[ ] Support tickets work
[ ] Dashboard works
[ ] Reports work
[ ] Export works
[ ] Notifications work
[ ] Audit logs work
[ ] Database indexes exist
[ ] Error handling works
[ ] Critical workflows have tests
[ ] No hard-coded credentials
[ ] Environment variables are configured
[ ] Production build succeeds

# 75. Future Integration Architecture
The CRM should be designed so the POS application can communicate with it later.
Potential future architecture:
                 ┌─────────────────┐
                 │       CRM       │
                 │                 │
                 │ Customers       │
                 │ Installations   │
                 │ Licenses        │
                 │ Billing         │
                 └────────┬────────┘
                          │
                     API / Events
                          │
                 ┌────────▼────────┐
                 │   POS Backend   │
                 └────────┬────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
          POS Installation A   POS Installation B

The installation ID should eventually serve as a stable identifier connecting CRM records with POS installations.

Potential future capabilities:

License validation
License activation
License renewal
Installation heartbeat
Software version reporting
Terminal count synchronization
Remote activation
Remote suspension
Usage reporting
Software update management

These are future features and should not unnecessarily complicate V1.

# 76. Definition of Done
The CRM is considered V1 complete when:
All core modules are implemented.
All major workflows work end-to-end.
Database relationships are enforced.
Financial calculations are correct.
Licensing history is preserved.
RBAC is enforced server-side.
Audit logging is implemented.
Critical business logic has automated tests.
Dashboard metrics match underlying database records.
Application can be deployed using documented deployment instructions.
Seed data can be loaded into a fresh development environment.
No critical security or data-integrity issues remain.

# 77. Final Instruction to Antigravity
Do not attempt to build the entire application in one uncontrolled generation.

Work incrementally.
For every development phase:
Inspect the existing project.
Identify what is already implemented.
Read the relevant specification.
Design the database changes.
Implement migrations.
Implement backend/domain logic.
Implement APIs.
Implement authorization.
Implement frontend screens.
Implement validation.
Implement tests.
Run tests.
Fix errors.
Review the implementation against this specification.
Only then proceed to the next phase.

Do not silently change business rules.

If a requirement is ambiguous, identify the ambiguity and choose the safest extensible implementation rather than introducing assumptions that could cause data loss.
Preserve existing functionality when making changes.
Never delete historical license, invoice, payment, support or audit records merely to simplify implementation.
The final system should be a maintainable, secure, production-quality internal CRM specifically designed for a POS software company.

# END OF SPECIFICATION
```
