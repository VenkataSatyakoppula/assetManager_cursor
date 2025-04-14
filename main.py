from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String, Date, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import pandas as pd
from datetime import datetime
import os

# Create database directory if it doesn't exist
os.makedirs("database", exist_ok=True)

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///database/asset_manager.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    serial_number = Column(Integer, unique=True, index=True)
    employee_name = Column(String)
    asset_type = Column(String)
    asset_issued_date = Column(Date)
    os = Column(String)
    email = Column(String)
    company = Column(String)
    monitor_type = Column(String)
    monitor_tag = Column(String)
    asset_id = Column(String, unique=True, index=True)


class DropdownOption(Base):
    __tablename__ = "dropdown_options"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String)
    value = Column(String)


# Create tables
Base.metadata.create_all(bind=engine)

# Initialize default dropdown options


def initialize_dropdown_options():
    db = SessionLocal()
    try:
        # Check if options already exist
        existing_options = db.query(DropdownOption).count()
        if existing_options == 0:
            # Default options
            default_options = [
                {"category": "asset_type", "value": "Computer"},
                {"category": "asset_type", "value": "Laptop"},
                {"category": "asset_type", "value": "Mobile"},
                {"category": "os", "value": "Windows 10"},
                {"category": "os", "value": "Windows 11"},
                {"category": "company", "value": "IMAR"},
                {"category": "company", "value": "LANDWORX GEC"},
                {"category": "company", "value": "AL-DHOW"},
                {"category": "company", "value": "ID-STUDIO"},
                {"category": "company", "value": "BLINQTECHS"},
                {"category": "company", "value": "LAVAJET"},
                {"category": "company", "value": "ECOVERTFM"},
                {"category": "company", "value": "INTHRA"},
                {"category": "company", "value": "WESTORE"},
                {"category": "company", "value": "CMTC"}
            ]

            for option in default_options:
                db_option = DropdownOption(**option)
                db.add(db_option)

            db.commit()
    finally:
        db.close()


# Initialize default options
initialize_dropdown_options()

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Database dependency


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# API endpoints


@app.get("/api/employees")
async def get_employees(
    serial_number: str = None,
    employee_name: str = None,
    asset_type: str = None,
    asset_issued_date: str = None,
    os: str = None,
    email: str = None,
    company: str = None,
    monitor_type: str = None,
    monitor_tag: str = None,
    asset_id: str = None
):
    db = SessionLocal()
    query = db.query(Employee)

    # Apply filters if provided
    if serial_number:
        query = query.filter(Employee.serial_number == int(serial_number))
    if employee_name:
        query = query.filter(Employee.employee_name == employee_name)
    if asset_type:
        query = query.filter(Employee.asset_type == asset_type)
    if asset_issued_date:
        query = query.filter(Employee.asset_issued_date == datetime.strptime(
            asset_issued_date, "%Y-%m-%d").date())
    if os:
        query = query.filter(Employee.os == os)
    if email:
        query = query.filter(Employee.email == email)
    if company:
        query = query.filter(Employee.company == company)
    if monitor_type:
        query = query.filter(Employee.monitor_type == monitor_type)
    if monitor_tag:
        query = query.filter(Employee.monitor_tag == monitor_tag)
    if asset_id:
        query = query.filter(Employee.asset_id == asset_id)

    employees = query.all()
    db.close()
    return employees


@app.post("/api/employees")
async def create_employee(employee_data: dict):
    db = SessionLocal()

    employee = Employee(
        serial_number=employee_data["serial_number"],
        employee_name=employee_data["employee_name"],
        asset_type=employee_data["asset_type"],
        asset_issued_date=datetime.strptime(
            employee_data["asset_issued_date"], "%Y-%m-%d").date(),
        os=employee_data["os"],
        email=employee_data["email"],
        company=employee_data["company"],
        monitor_type=employee_data["monitor_type"],
        monitor_tag=employee_data["monitor_tag"],
        asset_id=employee_data["asset_id"]
    )

    db.add(employee)
    db.commit()
    db.refresh(employee)
    db.close()
    return employee


@app.put("/api/employees/{employee_id}")
async def update_employee(employee_id: int, employee_data: dict):
    db = SessionLocal()
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    for key, value in employee_data.items():
        if key == "asset_issued_date":
            value = datetime.strptime(value, "%Y-%m-%d").date()
        setattr(employee, key, value)

    db.commit()
    db.refresh(employee)
    db.close()
    return employee


@app.delete("/api/employees/{employee_id}")
async def delete_employee(employee_id: int):
    db = SessionLocal()
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    db.delete(employee)
    db.commit()
    db.close()
    return {"message": "Employee deleted successfully"}


@app.get("/api/dropdown-options/{category}")
async def get_dropdown_options(category: str):
    db = SessionLocal()
    options = db.query(DropdownOption).filter(
        DropdownOption.category == category).all()
    db.close()
    return [option.value for option in options]


@app.post("/api/dropdown-options")
async def add_dropdown_option(option_data: dict):
    db = SessionLocal()
    option = DropdownOption(
        category=option_data["category"], value=option_data["value"])
    db.add(option)
    db.commit()
    db.refresh(option)
    db.close()
    return option


@app.delete("/api/dropdown-options")
async def delete_dropdown_option(option_data: dict):
    db = SessionLocal()
    option = db.query(DropdownOption).filter(
        DropdownOption.category == option_data["category"],
        DropdownOption.value == option_data["value"]
    ).first()
    if not option:
        raise HTTPException(status_code=404, detail="Option not found")

    db.delete(option)
    db.commit()
    db.close()
    return {"message": "Option deleted successfully"}


@app.get("/api/export")
async def export_data(
    serial_number: str = None,
    employee_name: str = None,
    asset_type: str = None,
    asset_issued_date: str = None,
    os: str = None,
    email: str = None,
    company: str = None,
    monitor_type: str = None,
    monitor_tag: str = None,
    asset_id: str = None
):
    db = SessionLocal()
    query = db.query(Employee)

    # Apply filters if provided
    if serial_number:
        query = query.filter(Employee.serial_number == int(serial_number))
    if employee_name:
        query = query.filter(Employee.employee_name == employee_name)
    if asset_type:
        query = query.filter(Employee.asset_type == asset_type)
    if asset_issued_date:
        query = query.filter(Employee.asset_issued_date == datetime.strptime(
            asset_issued_date, "%Y-%m-%d").date())
    if os:
        query = query.filter(Employee.os == os)
    if email:
        query = query.filter(Employee.email == email)
    if company:
        query = query.filter(Employee.company == company)
    if monitor_type:
        query = query.filter(Employee.monitor_type == monitor_type)
    if monitor_tag:
        query = query.filter(Employee.monitor_tag == monitor_tag)
    if asset_id:
        query = query.filter(Employee.asset_id == asset_id)

    employees = query.all()

    # Create DataFrame
    df = pd.DataFrame([{
        "Serial Number": emp.serial_number,
        "Employee Name": emp.employee_name,
        "Asset Type": emp.asset_type,
        "Asset Issued Date": emp.asset_issued_date,
        "OS": emp.os,
        "Email": emp.email,
        "Company": emp.company,
        "Monitor Type": emp.monitor_type,
        "Monitor Tag": emp.monitor_tag,
        "Asset ID": emp.asset_id
    } for emp in employees])

    # Convert to CSV
    csv_data = df.to_csv(index=False)
    db.close()
    return {"csv_data": csv_data}


@app.get("/api/employees/{employee_id}")
async def get_employee(employee_id: int):
    db = SessionLocal()
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.close()
    return employee
