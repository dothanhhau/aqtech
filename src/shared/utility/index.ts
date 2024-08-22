import { generatedKey } from '@/common/generatedKey';
import dayjs from 'dayjs';

export function getReceiptNumber(length = 8): number {
  return Math.floor(Math.random() * 10 ** length);
}

export function getNthOccurrence(str: string, occurNum: number) {
  return str.split('/').slice(0, occurNum).join('/').length;
}

export function getMagicNumber(buffer: Buffer, signatureLength = 4) {
  const bytes = buffer.slice(0, signatureLength);
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

export function addTimestampToFileName(fileName: string) {
  const ts = new Date().getTime().toString();
  let fileNameArr = fileName.split('.');
  // fileNameArr.splice(0, 0, ts); fileNameArr.join('.');
  const lastElement = fileNameArr[fileNameArr.length - 1];
  return generatedKey.ref(8) + '-' + ts.concat('.', lastElement);
}

export function addTimestampToFileNames(fileName: string) {
  const ts = new Date().getTime().toString();
  const fileNameArr = fileName.split('.');
  if (fileNameArr.length < 2) {
    return `${fileName}-${ts}`;
  }

  const extension = fileNameArr.pop(); 
  const baseName = fileNameArr.join('.'); 
  return `${baseName}-${ts}.${extension}`;
}

export function removeTimezone(date: Date) {
  return date.toString().replace('T', ' ').replace('Z', '');
}

export function formatDate(date: any) {
  var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

export function dynamicSort(property: string) {
  var sortOrder = 1;
  if (property[0] === '-') {
    sortOrder = -1;
    property = property.substr(1);
  }
  return function (a, b) {
    var result = a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
    return result * sortOrder;
  };
}

export function sortName(data: any) {
  let collator = new Intl.Collator('vi-VN', {
    numeric: true,
    sensitivity: 'base',
  });

  const result = data?.sort(function (a, b) {
    if (!a?.fullname || !b?.fullname) {
      return 0; // Return 0 to indicate no sorting is needed for null fullname
    }

    return collator.compare(
      a?.fullname.trim().split(' ').reverse().join(' '),
      b?.fullname.trim().split(' ').reverse().join(' '),
    );
    // return collator.compare(a?.lastname?.split(' ').slice(-1)[0], b?.lastname?.split(' ').slice(-1)[0]);
  });

  return result;
}

export function sortFullName(data: any) {
  let collator = new Intl.Collator('vi-VN', {
    numeric: true,
    sensitivity: 'base',
  });

  const result = data?.sort(function (a, b) {
    return collator.compare(a?.name, b?.name);
  });

  return result;
}

export function setLastName(fullName: string) {
  if (!fullName) return '';
  let pieces = fullName.split(' ');
  return pieces[pieces.length - 1];
}

export function removeAccents(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}
export function paginate(items, page, perPage) {
  const offset = perPage * (page - 1);
  const totalPages = Math.ceil(items.length / perPage);
  const paginatedItems = items.slice(offset, perPage * page);

  return {
    previousPage: page - 1 ? page - 1 : null,
    nextPage: totalPages > page ? page + 1 : null,
    total: items.length,
    totalPages: totalPages,
    items: paginatedItems,
  };
}

export function setFirstName(fullName: string) {
  if (!fullName) return '';
  return fullName.split(' ').slice(0, -1).join(' ');
}

export function filterRemoveSign(str) {
  str = str.replace(/\s+/g, ' ');
  str = str.trim();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  return str;
}

export function sortByFirstname(data: any[], sortOrder: 'asc' | 'desc' = 'asc'): any[] {
  const collator = new Intl.Collator('vi-VN', {
    numeric: true,
    sensitivity: 'base',
  });

  return data.sort((a, b) => {
    // Validate sortOrder to be either "asc" or "desc"
    const validatedSortOrder = sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc';

    // Adjust the compare function based on the validated sortOrder
    const comparison = collator.compare(a.firstname, b.firstname);
    return validatedSortOrder === 'asc' ? comparison : -comparison;
  });
}

export function getMonthFromDateRange(start_date: Date, end_date: Date): number[] {
  const months: number[] = [];
  const monthStart = start_date.getMonth() + 1;
  const monthEnd = end_date.getMonth() + 1;

  for (let i = monthStart; i <= monthEnd; i++) {
    months.push(i);
  }
  return months;
}

export function dateFormatDisplay(date: Date): string {
  return dayjs(date).format('DD/MM/YYYY');
}
