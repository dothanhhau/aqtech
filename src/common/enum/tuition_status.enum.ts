
export enum TuitionStatus {
  PAID = 'paid', 
  UNPAID = 'unpaid', 
  PARTIALLY_PAID = 'partially_paid',
}

export enum Pay {
  PART = 'part',
  FULL = 'full',
}

export enum SEMESTER {
  SEMESTER_ONE = 'semester_one', 
  SEMESTER_TWO = 'semester_two', 
  SEMESTER_THREE = 'semester_three', 
}

export const SEMESTER_DESC = {
  [SEMESTER.SEMESTER_ONE]: 'Học kỳ I',
  [SEMESTER.SEMESTER_TWO]: 'Học kỳ II',
  [SEMESTER.SEMESTER_THREE]: 'Học kỳ hè',
};


export enum StatusRevenue {
  DATA_OTHER_THAN_IMPORT_FILE = 'DATA_OTHER_THAN_IMPORT_FILE', 
  DATA_SAME_AS_IMPORT_FILE = 'DATA_SAME_AS_IMPORT_FILE', 
}