# Equipment Request Management System

A web application for managing equipment requests across multiple forms (UAV, Item Replacement, Deployment).

## Features

- **Multi-form support**: UAV, Item Replacement (Damage Inventory), and Deployment forms
- **Auto-filled fields**: Request Date, Request ID (auto-generated with timestamp)
- **Google Sheets integration**: Fetches ticket data and main issue mappings from Google Sheets
- **Cross-sheet lookup**: Automatically pulls Issue ID from primary sheet and looks up Main Issue from secondary sheet
- **Dynamic component population**: Auto-fills damage and replacement component names based on issue mappings
- **Success feedback**: Displays request ID confirmation after submission
- **Responsive UI**: Clean, user-friendly interface with per-form action buttons

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Data Source**: Google Sheets (CSV export)
- **CSV Parser**: PapaParse (CDN)
- **Styling**: Custom CSS with gradient buttons and form styling

## File Structure

```
├── index.html       # Main form markup
├── script.js        # Form logic, sheet integration, auto-fill logic
├── styles.css       # Styling and layout
├── .gitignore       # Git ignore file
└── README.md        # This file
```

## How It Works

### Ticket ID Lookup
1. Enter a Ticket ID in the Item Replacement form
2. Script matches the Ticket ID against the primary Google Sheet
3. Auto-fills requester, project, team, and drone information

### Issue ID & Main Issue Mapping
1. From the matched ticket row, captures the **Issue ID**
2. Loads the secondary Google Sheet (Main Issue mapping)
3. Finds the matching Issue ID row
4. Extracts the Main Issue and populates:
   - `damage_component_name`
   - `replace_component_name`

### Request ID Generation
- Format: `PREFIX-DDMMYYYYHHMMSSMS`
- Prefixes:
  - `UAV` for UAV Request
  - `RIR` for Item Replacement (Request Inventory Replacement)
  - `NDR` for Deployment (New Deployment Request)

## Google Sheets Setup

### Primary Sheet (Tickets)
- Columns: Ticket ID, Issue ID, Support exec Assigned, Project-ID, Team ID, Operator Name, Phone Number, Combine Flight_ID

### Secondary Sheet (Main Issue Mapping)
- Columns: Main Issue, Main Issue ID, Issue ID, Sub Issue, RCA Status, etc.

## Usage

1. **Select Form**: Choose from UAV, Item Replacement, or Deployment
2. **Fill Fields**: Enter required information (Request Date is auto-filled to today)
3. **Submit**: Click Submit to generate Request ID and see confirmation
4. **Back**: Use Back button to return to form selector

## Console Logging

The app logs detailed information for debugging:
- Sheet load status and headers
- Ticket lookup matches
- Issue ID capture and normalization
- Main issue sheet lookups and matches
- Final payload before submission

## Future Enhancements

- Backend persistence (database or sheet append)
- Email notifications on submission
- User authentication
- Request history and tracking
- Advanced filtering and reporting

## License

MIT
