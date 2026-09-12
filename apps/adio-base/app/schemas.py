from typing import Literal

import re

from pydantic import BaseModel, ConfigDict, Field, field_validator


class GenerationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    requirement: str = Field(min_length=5, max_length=1000)
    framework: Literal["react", "html"]
    componentName: str = Field(min_length=3, max_length=50, pattern=r"^[A-Za-z][A-Za-z0-9_-]*$")
    features: list[str] = Field(default_factory=list, max_length=20)

    @field_validator("features")
    @classmethod
    def validate_features(cls, features: list[str]) -> list[str]:
        return [feature.strip()[:50] for feature in features if feature.strip()]


class StreamEvent(BaseModel):
    type: Literal["processing", "success", "error"]
    message: str | None = None
    data: dict | None = None
    error: str | None = None
    status: int | None = None
    timestamp: str | None = None


class SignupRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(min_length=3, max_length=320)
    full_name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=8, max_length=128)
    mobile: str | None = Field(default=None, max_length=30)

    @field_validator("email")
    @classmethod
    def validate_email(cls, email: str) -> str:
        normalized = email.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", normalized):
            raise ValueError("Enter a valid email address")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password(cls, password: str) -> str:
        if not re.fullmatch(r"(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}", password):
            raise ValueError("Password must be at least 8 characters and contain letters and numbers only")
        return password

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, mobile: str | None) -> str | None:
        if mobile is not None and not re.fullmatch(r"\+\d{1,4}\d{7,15}", mobile):
            raise ValueError("Mobile number must include a country code and 7 to 15 digits")
        return mobile


class SigninRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, email: str) -> str:
        normalized = email.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", normalized):
            raise ValueError("Enter a valid email address")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password(cls, password: str) -> str:
        if not re.fullmatch(r"(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}", password):
            raise ValueError("Password must be at least 8 characters and contain letters and numbers only")
        return password
