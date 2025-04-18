# Asset Manager

A web-based asset management system for tracking company assets and employees.

## Features

- Asset tracking and management
- Employee information management
- Customizable dropdown options
- Data export to CSV
- Dashboard with visualizations
- Filtering and search capabilities

## Development Setup

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Run the development server:
   ```bash
   ./run.bat
   ```

## Building for Production

1. Run the build script:
   ```bash
   build.bat
   ```
2. The production package will be created in the `build` directory

## Project Structure

```
asset_manager/
├── main.py              # Main application file
├── requirements.txt     # Python dependencies
├── install.bat         # Installation script
├── run.bat            # Development startup script
├── prod.bat           # Production startup script
├── build.bat          # Build script
├── .gitignore         # Git ignore file
└── static/            # Static files
    ├── index.html     # Web interface
    ├── styles.css     # Styling
    └── script.js      # Frontend functionality
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
