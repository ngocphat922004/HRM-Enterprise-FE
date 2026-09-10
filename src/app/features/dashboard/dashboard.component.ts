import { CommonModule } from '@angular/common';

import {
  HttpClient,
  HttpErrorResponse,
} from '@angular/common/http';

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';

import {
  FormsModule,
} from '@angular/forms';

import {
  Router,
  RouterLink,
} from '@angular/router';

import {
  Observable,
  finalize,
  forkJoin,
  map,
} from 'rxjs';

import {
  environment,
} from '../../../environments/environment';

import {
  API_ENDPOINTS,
} from '../../core/constants/api-endpoints.constants';

import {
  DashboardStat,
  DepartmentRatio,
  EmployeeItem,
  ExpiringContractItem,
  LeaveRequestItem,
} from './dashboard.model';


interface ApiResponse<T> {

  success:
  boolean;

  message:
  string;

  data:
  T | null;

  errors?:
  Record<
    string,
    string[] | string
  > |
  null;
}


interface DashboardNhanVien {

  maNV:
  number;

  hoTen:
  string;

  maPB:
  number | null;

  maCV:
  number | null;

  ngayVaoLam:
  string;

  trangThai:
  string;
}


interface DashboardPhongBan {

  maPB:
  number;

  tenPB:
  string;

  trangThai:
  string;
}


interface DashboardChucVu {

  maCV:
  number;

  tenCV:
  string;

  moTa?:
  string | null;
}


interface DashboardNghiPhep {

  maNP:
  number;

  maNV:
  number;

  maLoaiNP:
  number;

  tuNgay:
  string;

  denNgay:
  string;

  lyDo:
  string | null;

  trangThai:
  string;

  nguoiDuyet:
  number | null;
}


interface DashboardLoaiNghiPhep {

  maLoaiNP:
  number;

  tenLoaiNP:
  string;

  moTa:
  string | null;
}


interface DashboardChamCong {

  maCC:
  number;

  maNV:
  number;

  maCa:
  number;

  ngayChamCong:
  string;

  gioVao:
  string | null;

  gioRa:
  string | null;

  soGioLam:
  number;

  trangThai:
  string;

  ghiChu:
  string | null;
}


interface DashboardHopDong {

  maHD:
  number;

  maNV:
  number;

  maLoaiHD:
  number;

  ngayBatDau:
  string;

  ngayKetThuc:
  string | null;

  luongCoBan:
  number;

  trangThai:
  string;
}


@Component({
  selector:
    'app-dashboard',

  standalone:
    true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
  ],

  templateUrl:
    './dashboard.component.html',

  styleUrl:
    './dashboard.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent
  implements OnInit, OnDestroy {



  searchTerm =
    '';

  toastMessage =
    '';


  isLoading =
    false;


  errorMessage =
    '';




  stats:
    DashboardStat[] =
    [];


  employeeTrend:
    Array<{
      month:
      string;

      value:
      number;
    }> =
    [];


  departments:
    DepartmentRatio[] =
    [];


  employees:
    EmployeeItem[] =
    [];


  leaveRequests:
    LeaveRequestItem[] =
    [];


  expiringContracts:
    ExpiringContractItem[] =
    [];


  expiringContractCount =
    0;



  private readonly updatingLeaveIds =
    new Set<number>();


  private toastTimer:
    ReturnType<
      typeof setTimeout
    > | null =
    null;


  private readonly apiBaseUrl =
    environment.apiBaseUrl;


  constructor(
    private readonly router:
      Router,

    private readonly http:
      HttpClient,

    private readonly changeDetectorRef:
      ChangeDetectorRef,
  ) { }




  ngOnInit():
    void {

    this.loadDashboard();
  }


  ngOnDestroy():
    void {

    if (
      this.toastTimer
    ) {

      clearTimeout(
        this.toastTimer,
      );
    }
  }




  get filteredEmployees():
    EmployeeItem[] {

    const term =
      this.searchTerm
        .trim()
        .toLocaleLowerCase(
          'vi',
        );


    if (
      !term
    ) {

      return this.employees;
    }


    return this.employees
      .filter(
        (
          employee,
        ) =>

          `${employee.name} ${employee.position} ${employee.employeeCode}`
            .toLocaleLowerCase(
              'vi',
            )
            .includes(
              term,
            ),
      );
  }



  get departmentChartBackground():
    string {

    if (
      this.departments.length ===
      0
    ) {

      return 'conic-gradient(#e7e5ef 0% 100%)';
    }


    const colors = [
      '#4f46e5',
      '#64748b',
      '#f59e0b',
      '#e7e5ef',
    ];


    let cursor =
      0;


    const segments =
      this.departments
        .map(
          (
            department,
            index,
          ) => {

            const start =
              cursor;


            const end =
              index ===
                this.departments.length -
                1

                ? 100

                : Math.min(
                  100,

                  cursor +
                  department.value,
                );


            cursor =
              end;


            return `${colors[index % colors.length]} ${start}% ${end}%`;
          },
        );


    return `conic-gradient(${segments.join(', ')})`;
  }


  retry():
    void {

    if (
      this.isLoading
    ) {

      return;
    }


    this.loadDashboard();
  }




  updateLeaveStatus(
    id:
      number,

    status:
      'approved' |
      'rejected',
  ): void {

    if (
      this.updatingLeaveIds
        .has(
          id,
        )
    ) {

      return;
    }


    const endpoint =
      status ===
        'approved'

        ? `${this.apiBaseUrl}${API_ENDPOINTS.nghiPhepApprove(id)}`

        : `${this.apiBaseUrl}${API_ENDPOINTS.nghiPhepReject(id)}`;


    this.updatingLeaveIds
      .add(
        id,
      );


    this.http
      .put(
        endpoint,
        null,
      )
      .pipe(
        finalize(
          () => {

            this.updatingLeaveIds
              .delete(
                id,
              );


            this.changeDetectorRef
              .markForCheck();
          },
        ),
      )
      .subscribe({

        next: () => {


          this.leaveRequests =
            this.leaveRequests
              .filter(
                (
                  request,
                ) =>
                  request.id !==
                  id,
              );



          const pendingStat =
            this.stats
              .find(
                (
                  item,
                ) =>
                  item.title ===
                  'Đơn chờ duyệt',
              );


          if (
            pendingStat
          ) {

            pendingStat.value =
              String(
                Math.max(
                  0,

                  Number(
                    pendingStat.value,
                  ) -
                  1,
                ),
              )
                .padStart(
                  2,
                  '0',
                );
          }


          this.showToast(
            status ===
              'approved'

              ? 'Đã duyệt đơn nghỉ phép.'

              : 'Đã từ chối đơn nghỉ phép.',
          );


          this.changeDetectorRef
            .markForCheck();
        },


        error: (
          error:
            HttpErrorResponse,
        ) => {


          this.showToast(
            this.getApiErrorMessage(
              error,

              status ===
                'approved'

                ? 'Không thể duyệt đơn nghỉ phép.'

                : 'Không thể từ chối đơn nghỉ phép.',
            ),
          );
        },
      });
  }




  openContract(
    maHD:
      number,
  ): void {

    if (
      !Number.isInteger(
        maHD,
      ) ||
      maHD <=
      0
    ) {

      this.showToast(
        'Không xác định được hợp đồng cần mở.',
      );

      return;
    }


    void this.router
      .navigate([
        '/contracts',
        maHD,
      ]);
  }

  private loadDashboard():
    void {

    this.isLoading =
      true;


    this.errorMessage =
      '';


    forkJoin({

      employees:
        this.getList<
          DashboardNhanVien
        >(
          API_ENDPOINTS.nhanVien,
        ),


      departments:
        this.getList<
          DashboardPhongBan
        >(
          API_ENDPOINTS.phongBan,
        ),


      positions:
        this.getList<
          DashboardChucVu
        >(
          API_ENDPOINTS.chucVu,
        ),


      leaves:
        this.getList<
          DashboardNghiPhep
        >(
          API_ENDPOINTS.nghiPhep,
        ),


      leaveTypes:
        this.getList<
          DashboardLoaiNghiPhep
        >(
          API_ENDPOINTS.loaiNghiPhep,
        ),


      attendance:
        this.getList<
          DashboardChamCong
        >(
          API_ENDPOINTS.chamCong,
        ),


      contracts:
        this.getList<
          DashboardHopDong
        >(
          API_ENDPOINTS.hopDong,
        ),

    })
      .pipe(
        finalize(
          () => {

            this.isLoading =
              false;


            this.changeDetectorRef
              .markForCheck();
          },
        ),
      )
      .subscribe({

        next: ({
          employees,
          departments,
          positions,
          leaves,
          leaveTypes,
          attendance,
          contracts,
        }) => {

          const today =
            this.today();




          const activeEmployees =
            employees
              .filter(
                (
                  employee,
                ) =>
                  employee.trangThai ===
                  'Đang làm việc',
              );


          const newEmployeesThisMonth =
            employees
              .filter(
                (
                  employee,
                ) =>
                  this.isSameMonth(
                    employee.ngayVaoLam,

                    today,
                  ),
              )
              .length;


          const approvedLeaveToday =
            leaves
              .filter(
                (
                  leave,
                ) =>
                  leave.trangThai ===
                  'Đã duyệt' &&

                  this.dateInRange(
                    today,

                    leave.tuNgay,

                    leave.denNgay,
                  ),
              );


          const lateToday =
            attendance
              .filter(
                (
                  item,
                ) =>
                  this.dateOnly(
                    item.ngayChamCong,
                  ) ===
                  today &&

                  item.trangThai ===
                  'Đi trễ',
              );


          const pendingLeaves =
            leaves
              .filter(
                (
                  leave,
                ) =>
                  leave.trangThai ===
                  'Chờ duyệt',
              );


          const activePercent =
            employees.length >
              0

              ? (
                activeEmployees.length /
                employees.length
              ) *
              100

              : 0;


          this.stats = [

            {
              title:
                'Tổng nhân viên',

              value:
                String(
                  employees.length,
                ),

              description:
                `+${newEmployeesThisMonth} tháng này`,

              icon:
                'users',

              theme:
                'primary',
            },

            {
              title:
                'Đang làm việc',

              value:
                String(
                  activeEmployees.length,
                ),

              description:
                `${activePercent.toFixed(1)}% tổng nhân sự`,

              icon:
                'briefcase',

              theme:
                'warning',
            },

            {
              title:
                'Nghỉ phép hôm nay',

              value:
                String(
                  approvedLeaveToday.length,
                )
                  .padStart(
                    2,
                    '0',
                  ),

              description:
                approvedLeaveToday.length >
                  0

                  ? 'Đơn đã được duyệt'

                  : 'Không có nhân viên nghỉ',

              icon:
                'calendar',

              theme:
                'info',
            },

            {
              title:
                'Đi muộn',

              value:
                String(
                  lateToday.length,
                )
                  .padStart(
                    2,
                    '0',
                  ),

              description:
                lateToday.length >
                  0

                  ? 'Cần theo dõi'

                  : 'Không ghi nhận đi trễ',

              icon:
                'clock',

              theme:
                'danger',
            },

            {
              title:
                'Đơn chờ duyệt',

              value:
                String(
                  pendingLeaves.length,
                )
                  .padStart(
                    2,
                    '0',
                  ),

              description:
                pendingLeaves.length >
                  0

                  ? 'Yêu cầu đang chờ xử lý'

                  : 'Không có đơn chờ',

              icon:
                'document',

              theme:
                'primary',
            },
          ];




          this.employeeTrend =
            this.buildEmployeeTrend(
              employees,
            );




          this.departments =
            this.buildDepartmentRatio(
              employees,

              departments,
            );




          this.employees =
            employees
              .slice()
              .sort(
                (
                  a,
                  b,
                ) => {

                  const dateCompare =
                    this.dateOnly(
                      b.ngayVaoLam,
                    )
                      .localeCompare(
                        this.dateOnly(
                          a.ngayVaoLam,
                        ),
                      );


                  if (
                    dateCompare !==
                    0
                  ) {

                    return dateCompare;
                  }


                  return (
                    b.maNV -
                    a.maNV
                  );
                },
              )
              .slice(
                0,
                5,
              )
              .map(
                (
                  employee,
                ) => {

                  const position =
                    positions
                      .find(
                        (
                          item,
                        ) =>
                          item.maCV ===
                          employee.maCV,
                      );


                  return {

                    name:
                      employee.hoTen,

                    position:
                      position
                        ?.tenCV ??
                      'Chưa có chức vụ',

                    employeeCode:
                      `NV${String(
                        employee.maNV,
                      ).padStart(
                        5,
                        '0',
                      )}`,

                    initials:
                      this.getInitials(
                        employee.hoTen,
                      ),
                  };
                },
              );




          this.leaveRequests =
            pendingLeaves
              .slice()
              .sort(
                (
                  a,
                  b,
                ) =>
                  b.maNP -
                  a.maNP,
              )
              .slice(
                0,
                5,
              )
              .map(
                (
                  leave,
                ) => {

                  const employee =
                    employees
                      .find(
                        (
                          item,
                        ) =>
                          item.maNV ===
                          leave.maNV,
                      );


                  const leaveType =
                    leaveTypes
                      .find(
                        (
                          item,
                        ) =>
                          item.maLoaiNP ===
                          leave.maLoaiNP,
                      );


                  return {

                    id:
                      leave.maNP,

                    employeeName:
                      employee
                        ?.hoTen ??
                      `Nhân viên #${leave.maNV}`,

                    leaveType:
                      leaveType
                        ?.tenLoaiNP ??
                      'Nghỉ phép',

                    numberOfDays:
                      this.countDaysInclusive(
                        leave.tuNgay,

                        leave.denNgay,
                      ),

                    initials:
                      this.getInitials(
                        employee
                          ?.hoTen ??
                        `NV${leave.maNV}`,
                      ),

                    status:
                      'pending',
                  };
                },
              );




          const expiringContracts =
            contracts
              .filter(
                (
                  contract,
                ) => {

                  if (
                    !contract.ngayKetThuc
                  ) {

                    return false;
                  }


                  const remainingDays =
                    this.daysFromToday(
                      contract.ngayKetThuc,
                    );


                  return (
                    remainingDays >=
                    0 &&

                    remainingDays <=
                    30
                  );
                },
              )
              .map(
                (
                  contract,
                ) => {

                  const employee =
                    employees
                      .find(
                        (
                          item,
                        ) =>
                          item.maNV ===
                          contract.maNV,
                      );


                  return {

                    maHD:
                      contract.maHD,

                    employeeName:
                      employee
                        ?.hoTen ??
                      `Nhân viên #${contract.maNV}`,

                    expiryDate:
                      this.formatDate(
                        contract.ngayKetThuc ??
                        '',
                      ),

                    remainingDays:
                      this.daysFromToday(
                        contract.ngayKetThuc ??
                        '',
                      ),
                  };
                },
              )
              .sort(
                (
                  a,
                  b,
                ) =>
                  a.remainingDays -
                  b.remainingDays,
              );


          this.expiringContractCount =
            expiringContracts.length;


          this.expiringContracts =
            expiringContracts
              .slice(
                0,
                5,
              );


          this.changeDetectorRef
            .markForCheck();
        },


        error: (
          error:
            HttpErrorResponse,
        ) => {


          this.resetDashboard();


          this.errorMessage =
            this.getApiErrorMessage(
              error,

              'Không thể tải dữ liệu tổng quan.',
            );


          this.showToast(
            this.errorMessage,
          );
        },
      });
  }




  private buildDepartmentRatio(
    employees:
      DashboardNhanVien[],

    departments:
      DashboardPhongBan[],
  ): DepartmentRatio[] {

    if (
      employees.length ===
      0
    ) {

      return [];
    }


    const classNames = [
      'department--primary',
      'department--secondary',
      'department--warning',
      'department--muted',
    ];


    const departmentIds =
      new Set(
        departments.map(
          department =>
            department.maPB,
        ),
      );


    const rows:
      Array<{
        name: string;
        count: number;
      }> =
      departments
        .map(
          department => ({
            name:
              department.tenPB,

            count:
              employees
                .filter(
                  employee =>
                    employee.maPB ===
                    department.maPB,
                )
                .length,
          }),
        )
        .filter(
          item =>
            item.count >
            0,
        );


    const unassigned =
      employees
        .filter(
          employee =>
            employee.maPB ===
            null ||
            employee.maPB ===
            undefined,
        )
        .length;


    if (
      unassigned >
      0
    ) {

      rows.push({
        name:
          'Chưa phân phòng',

        count:
          unassigned,
      });
    }


    const unknownDepartmentCount =
      employees
        .filter(
          employee =>
            employee.maPB !==
            null &&
            employee.maPB !==
            undefined &&
            !departmentIds.has(
              employee.maPB,
            ),
        )
        .length;


    if (
      unknownDepartmentCount >
      0
    ) {

      rows.push({
        name:
          'Khác',

        count:
          unknownDepartmentCount,
      });
    }


    rows.sort(
      (
        a,
        b,
      ) =>
        b.count -
        a.count,
    );


    let visibleRows =
      rows;


    if (
      rows.length >
      4
    ) {

      const leadingRows =
        rows.slice(
          0,
          3,
        );


      const remainingCount =
        rows
          .slice(
            3,
          )
          .reduce(
            (
              total,
              item,
            ) =>
              total +
              item.count,

            0,
          );


      visibleRows = [
        ...leadingRows,
        {
          name:
            'Khác',

          count:
            remainingCount,
        },
      ];
    }


    const percentages =
      visibleRows.map(
        item =>
          Number(
            (
              item.count /
              employees.length *
              100
            )
              .toFixed(
                1,
              ),
          ),
      );


    if (
      percentages.length >
      0
    ) {

      const totalBeforeLast =
        percentages
          .slice(
            0,
            -1,
          )
          .reduce(
            (
              total,
              value,
            ) =>
              total +
              value,

            0,
          );


      percentages[
        percentages.length -
        1
      ] =
        Number(
          Math.max(
            0,
            100 -
            totalBeforeLast,
          )
            .toFixed(
              1,
            ),
        );
    }


    return visibleRows
      .map(
        (
          item,
          index,
        ) => ({
          name:
            item.name,

          value:
            percentages[index] ??
            0,

          className:
            classNames[
            index %
            classNames.length
            ],
        }),
      );
  }


  private buildEmployeeTrend(
    employees:
      DashboardNhanVien[],
  ): Array<{
    month:
    string;

    value:
    number;
  }> {

    const result:
      Array<{
        month:
        string;

        value:
        number;
      }> =
      [];


    const current =
      new Date();


    for (
      let offset = 5;
      offset >= 0;
      offset -= 1
    ) {

      const monthDate =
        new Date(
          current.getFullYear(),

          current.getMonth() -
          offset,

          1,
        );


      const year =
        monthDate.getFullYear();


      const month =
        monthDate.getMonth() +
        1;


      const lastDay =
        new Date(
          year,

          month,

          0,
        )
          .getDate();


      const endOfMonth =
        `${year}-${this.pad2(month)}-${this.pad2(lastDay)}`;


      const count =
        employees
          .filter(
            (
              employee,
            ) => {

              const joinDate =
                this.dateOnly(
                  employee.ngayVaoLam,
                );


              return (
                !joinDate ||
                joinDate <=
                endOfMonth
              );
            },
          )
          .length;


      result.push({

        month:
          `T${this.pad2(month)}/${String(
            year,
          ).slice(
            -2,
          )}`,

        value:
          count,
      });
    }


    return result;
  }




  private getList<T>(
    endpoint:
      string,
  ): Observable<T[]> {

    return this.http
      .get<
        ApiResponse<T[]> |
        T[]
      >(
        `${this.apiBaseUrl}${endpoint}`,
      )
      .pipe(
        map(
          (
            response,
          ) => {

            if (
              Array.isArray(
                response,
              )
            ) {

              return response;
            }


            if (
              response.success ===
              false
            ) {
              throw new Error(
                response.message?.trim() ||
                'Không thể tải dữ liệu tổng quan.',
              );
            }

            return (
              response.data ??
              []
            );
          },
        ),
      );
  }




  private today():
    string {

    const now =
      new Date();


    return (
      `${now.getFullYear()}-` +
      `${this.pad2(
        now.getMonth() +
        1,
      )}-` +
      `${this.pad2(
        now.getDate(),
      )}`
    );
  }


  private dateOnly(
    value:
      string | null | undefined,
  ): string {

    if (
      !value
    ) {

      return '';
    }


    const result =
      value.slice(
        0,
        10,
      );


    return /^\d{4}-\d{2}-\d{2}$/
      .test(
        result,
      )

      ? result

      : '';
  }


  private isSameMonth(
    value:
      string,

    target:
      string,
  ): boolean {

    const date =
      this.dateOnly(
        value,
      );


    return (
      date.length >=
      7 &&

      target.length >=
      7 &&

      date.slice(
        0,
        7,
      ) ===
      target.slice(
        0,
        7,
      )
    );
  }


  private dateInRange(
    date:
      string,

    start:
      string,

    end:
      string,
  ): boolean {

    const startDate =
      this.dateOnly(
        start,
      );


    const endDate =
      this.dateOnly(
        end,
      );


    if (
      !startDate ||
      !endDate
    ) {

      return false;
    }


    return (
      date >=
      startDate &&

      date <=
      endDate
    );
  }


  private countDaysInclusive(
    start:
      string,

    end:
      string,
  ): number {

    const startTime =
      this.dateToUtcTime(
        start,
      );


    const endTime =
      this.dateToUtcTime(
        end,
      );


    if (
      startTime ===
      null ||

      endTime ===
      null ||

      endTime <
      startTime
    ) {

      return 0;
    }


    return (
      Math.floor(
        (
          endTime -
          startTime
        ) /
        86400000,
      ) +
      1
    );
  }


  private daysFromToday(
    value:
      string,
  ): number {

    const targetTime =
      this.dateToUtcTime(
        value,
      );


    const todayTime =
      this.dateToUtcTime(
        this.today(),
      );


    if (
      targetTime ===
      null ||

      todayTime ===
      null
    ) {

      return Number
        .MAX_SAFE_INTEGER;
    }


    return Math.ceil(
      (
        targetTime -
        todayTime
      ) /
      86400000,
    );
  }


  private dateToUtcTime(
    value:
      string,
  ): number | null {

    const date =
      this.dateOnly(
        value,
      );


    if (
      !date
    ) {

      return null;
    }


    const [
      year,
      month,
      day,
    ] =
      date
        .split(
          '-',
        )
        .map(
          Number,
        );


    if (
      !year ||
      !month ||
      !day
    ) {

      return null;
    }


    return Date.UTC(
      year,
      month -
      1,
      day,
    );
  }


  private formatDate(
    value:
      string,
  ): string {

    const date =
      this.dateOnly(
        value,
      );


    if (
      !date
    ) {

      return '—';
    }


    const [
      year,
      month,
      day,
    ] =
      date.split(
        '-',
      );


    return (
      `${day}/${month}/${year}`
    );
  }


  private pad2(
    value:
      number,
  ): string {

    return String(
      value,
    )
      .padStart(
        2,
        '0',
      );
  }




  private getInitials(
    name:
      string,
  ): string {

    const parts =
      name
        .trim()
        .split(
          /\s+/,
        )
        .filter(
          Boolean,
        );


    if (
      parts.length ===
      0
    ) {

      return 'NV';
    }


    if (
      parts.length ===
      1
    ) {

      return parts[0]
        .slice(
          0,
          2,
        )
        .toUpperCase();
    }


    return parts
      .slice(
        -2,
      )
      .map(
        (
          part,
        ) =>
          part[0],
      )
      .join(
        '',
      )
      .toUpperCase();
  }




  private resetDashboard():
    void {

    this.stats =
      [];


    this.employeeTrend =
      [];


    this.departments =
      [];


    this.employees =
      [];


    this.leaveRequests =
      [];


    this.expiringContracts =
      [];


    this.expiringContractCount =
      0;
  }




  private getApiErrorMessage(
    error:
      HttpErrorResponse,

    fallback:
      string,
  ): string {

    const backendMessage =
      typeof error.error
        ?.message ===
        'string'

        ? error.error
          .message

        : '';


    if (
      backendMessage
    ) {

      return backendMessage;
    }


    const backendErrors =
      error.error
        ?.errors;


    if (
      backendErrors &&
      typeof backendErrors ===
      'object'
    ) {

      const messages =
        Object.values(
          backendErrors as
          Record<
            string,
            unknown
          >,
        )
          .flatMap(
            (
              value,
            ) => {

              if (
                Array.isArray(
                  value,
                )
              ) {

                return value.map(
                  (
                    item,
                  ) =>
                    String(
                      item,
                    ),
                );
              }


              return [
                String(
                  value,
                ),
              ];
            },
          )
          .filter(
            Boolean,
          );


      if (
        messages.length >
        0
      ) {

        return messages
          .join(
            ' ',
          );
      }
    }


    switch (
    error.status
    ) {

      case 0:

        return (
          'Không thể kết nối đến hệ thống.'
        );


      case 401:

        return (
          'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
        );


      case 403:

        return (
          'Bạn không có quyền xem dữ liệu tổng quan.'
        );


      case 404:

        return (
          'Không tìm thấy dữ liệu tổng quan.'
        );


      default:

        return fallback;
    }
  }




  showToast(
    message:
      string,
  ): void {

    this.toastMessage =
      message;


    this.changeDetectorRef
      .markForCheck();


    if (
      this.toastTimer
    ) {

      clearTimeout(
        this.toastTimer,
      );
    }


    this.toastTimer =
      setTimeout(
        () => {

          this.toastMessage =
            '';


          this.toastTimer =
            null;


          this.changeDetectorRef
            .markForCheck();

        },
        3000,
      );
  }
}
