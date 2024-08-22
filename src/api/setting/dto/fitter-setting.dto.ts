import { Pay } from "@/common/enum/tuition_status.enum";

export class FilterRevenueDto {
  regime_name?: string;
  office_id?: string;
  type_revenue?: string;
  name?: string;
  code?: string;
}

export class FilterExemptionDto {
  office_id?: string;
  // type_revenue?: string;
  name?: string;
  code?: string;
}

export class SettingDto {
  pay: Pay;
  start_date_semester_one: Date;
  end_date_semester_one: Date;
  start_date_semester_two: Date;
  end_date_semester_two: Date;
  start_date_semester_three: Date;
  end_date_semester_three: Date;
  edubill_config: string;
}
