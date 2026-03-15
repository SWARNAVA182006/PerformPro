from pydantic import BaseModel

class KPI(BaseModel):
    id: int
    employee_id: int
    skill_score: int
    feedback_score: int
    final_kpi_score: int

    class Config:
        from_attributes = True
