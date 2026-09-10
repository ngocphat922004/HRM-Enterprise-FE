import {
  CommonModule,
} from '@angular/common';

import {
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
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';

import {
  catchError,
  finalize,
  forkJoin,
  of,
} from 'rxjs';

import {
  HOP_DONG_TRANG_THAI,
  KHEN_THUONG_KY_LUAT_LOAI,
  NHAN_VIEN_PHU_CAP_TRANG_THAI,
  NHAN_VIEN_TRANG_THAI,
} from '../../../core/constants/status.constants';

import { MA_QUYEN } from '../../../core/constants/role.constants';
import { StorageService } from '../../../core/services/storage.service';


import {
  HopDong,
} from '../../contracts/models/hop-dong.model';

import {
  HopDongService,
} from '../../contracts/services/hop-dong.service';

import {
  ChamCong,
  ChamCongService,
  LoaiCa,
} from '../../attendance/services/cham-cong.service';

import {
  LoaiNghiPhep,
  NghiPhep,
  NghiPhepService,
} from '../../leave/services/nghi-phep.service';

import {
  BangLuong,
} from '../../payroll/models/bang-luong.model';

import {
  NhanVienPhuCap,
} from '../../payroll/models/nhan-vien-phu-cap.model';

import {
  PhuCap,
} from '../../payroll/models/phu-cap.model';

import {
  BangLuongService,
} from '../../payroll/services/bang-luong.service';

import {
  NhanVienPhuCapService,
} from '../../payroll/services/nhan-vien-phu-cap.service';

import {
  PhuCapService,
} from '../../payroll/services/phu-cap.service';

import {
  KhenThuongKyLuat,
} from '../../rewards-discipline/models/khen-thuong-ky-luat.model';

import {
  KhenThuongKyLuatService,
} from '../../rewards-discipline/services/khen-thuong-ky-luat.service';

import {
  NhanVienChiTiet,
} from '../models/nhan-vien.model';

import {
  NhanVienService,
} from '../services/nhan-vien.service';

import {
  EmployeeAllowanceHistoryItem,
  EmployeeAttendanceHistoryItem,
  EmployeeContractHistoryItem,
  EmployeeLeaveHistoryItem,
  EmployeePayrollHistoryItem,
  EmployeeProfile,
  EmployeeProfileHistoryItem,
  EmployeeProfileTab,
  EmployeeProfileTabItem,
} from './employee-profile.model';

@Component({
  selector:
    'app-employee-profile',

  standalone:
    true,

  imports: [
    CommonModule,
    RouterLink,
  ],

  templateUrl:
    './employee-profile.component.html',

  styleUrl:
    './employee-profile.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class EmployeeProfileComponent
  implements OnInit, OnDestroy {

  activeTab:
    EmployeeProfileTab =
    'personal';

  employeeId =
    0;

  currentRoleId =
    0;

  isSelfServiceView =
    false;

  isLoading =
    false;


  errorMessage =
    '';

  contractErrorMessage =
    '';

  attendanceErrorMessage =
    '';

  leaveErrorMessage =
    '';

  payrollErrorMessage =
    '';

  allowanceErrorMessage =
    '';

  historyErrorMessage =
    '';

  toastMessage =
    '';

  selectedContractId:
    number | null =
    null;

  private requestedContractId:
    number | null =
    null;

  private toastTimer:
    ReturnType<
      typeof setTimeout
    > | null =
    null;

  readonly tabs:
    EmployeeProfileTabItem[] = [
      {
        id:
          'personal',
        label:
          'Thông tin cá nhân',
      },
      {
        id:
          'work',
        label:
          'Thông tin công việc',
      },
      {
        id:
          'contract',
        label:
          'Hợp đồng',
      },
      {
        id:
          'attendance',
        label:
          'Chấm công & Nghỉ phép',
      },
      {
        id:
          'salary',
        label:
          'Lương & Phúc lợi',
      },
      {
        id:
          'history',
        label:
          'Lịch sử thay đổi',
      },
    ];

  get visibleTabs():
    EmployeeProfileTabItem[] {

    let allowedTabs:
      EmployeeProfileTab[];

    switch (
    this.currentRoleId
    ) {
      case MA_QUYEN.QUAN_TRI_VIEN:
        allowedTabs = [
          'personal',
          'work',
          'contract',
          'attendance',
          'salary',
          'history',
        ];
        break;

      case MA_QUYEN.NHAN_VIEN_NHAN_SU:
        allowedTabs = [
          'personal',
          'work',
          'contract',
          'attendance',
          'history',
        ];
        break;

      case MA_QUYEN.TRUONG_PHONG:
        allowedTabs = [
          'personal',
          'work',
          'attendance',
        ];
        break;

      case MA_QUYEN.NHAN_VIEN:
        allowedTabs = [
          'personal',
          'work',
          'contract',
          'attendance',
          'salary',
          'history',
        ];
        break;

      default:
        allowedTabs = [
          'personal',
          'work',
        ];
        break;
    }

    return this.tabs.filter(
      tab =>
        allowedTabs.includes(
          tab.id,
        ),
    );
  }

  get canEditEmployeeProfile():
    boolean {

    return (
      this.currentRoleId ===
      MA_QUYEN.QUAN_TRI_VIEN ||
      this.currentRoleId ===
      MA_QUYEN.NHAN_VIEN_NHAN_SU
    );
  }

  get canManageContracts():
    boolean {

    return this.canEditEmployeeProfile;
  }

  get canManageAllowances():
    boolean {

    return (
      this.currentRoleId ===
      MA_QUYEN.QUAN_TRI_VIEN
    );
  }

  private get canViewContractData():
    boolean {

    return (
      this.currentRoleId ===
      MA_QUYEN.QUAN_TRI_VIEN ||
      this.currentRoleId ===
      MA_QUYEN.NHAN_VIEN_NHAN_SU ||
      this.isSelfServiceView
    );
  }

  private get canViewAttendanceData():
    boolean {

    return (
      this.currentRoleId ===
      MA_QUYEN.QUAN_TRI_VIEN ||
      this.currentRoleId ===
      MA_QUYEN.NHAN_VIEN_NHAN_SU ||
      this.currentRoleId ===
      MA_QUYEN.TRUONG_PHONG ||
      this.isSelfServiceView
    );
  }

  private get canViewSalaryData():
    boolean {

    return (
      this.currentRoleId ===
      MA_QUYEN.QUAN_TRI_VIEN ||
      this.isSelfServiceView
    );
  }

  private get canViewHistoryData():
    boolean {

    return (
      this.currentRoleId ===
      MA_QUYEN.QUAN_TRI_VIEN ||
      this.currentRoleId ===
      MA_QUYEN.NHAN_VIEN_NHAN_SU ||
      this.isSelfServiceView
    );
  }

  employee:
    EmployeeProfile =
    this.createEmptyEmployee();

  contracts:
    EmployeeContractHistoryItem[] =
    [];

  attendanceRecords:
    EmployeeAttendanceHistoryItem[] =
    [];

  leaveRequests:
    EmployeeLeaveHistoryItem[] =
    [];

  payrollRecords:
    EmployeePayrollHistoryItem[] =
    [];

  allowances:
    EmployeeAllowanceHistoryItem[] =
    [];

  historyItems:
    EmployeeProfileHistoryItem[] =
    [];

  constructor(
    private readonly route:
      ActivatedRoute,

    private readonly router:
      Router,

    private readonly storageService:
      StorageService,

    private readonly nhanVienService:
      NhanVienService,


    private readonly hopDongService:
      HopDongService,

    private readonly chamCongService:
      ChamCongService,

    private readonly nghiPhepService:
      NghiPhepService,

    private readonly bangLuongService:
      BangLuongService,

    private readonly nhanVienPhuCapService:
      NhanVienPhuCapService,

    private readonly phuCapService:
      PhuCapService,

    private readonly khenThuongKyLuatService:
      KhenThuongKyLuatService,

    private readonly changeDetectorRef:
      ChangeDetectorRef,
  ) { }

  ngOnInit():
    void {

    const requestedTab =
      this.route
        .snapshot
        .queryParamMap
        .get(
          'tab',
        );

    if (
      this.isProfileTab(
        requestedTab,
      )
    ) {
      this.activeTab =
        requestedTab;
    }

    const requestedContractId =
      Number(
        this.route
          .snapshot
          .queryParamMap
          .get(
            'contractId',
          ),
      );

    if (
      Number.isInteger(
        requestedContractId,
      ) &&
      requestedContractId >
      0
    ) {
      this.requestedContractId =
        requestedContractId;
    }

    const id =
      Number(
        this.route
          .snapshot
          .paramMap
          .get(
            'id',
          ),
      );

    if (
      !Number.isInteger(
        id,
      ) ||
      id <=
      0
    ) {
      this.errorMessage =
        'Mã nhân viên không hợp lệ.';

      this.changeDetectorRef
        .markForCheck();

      return;
    }

    this.employeeId =
      id;

    const currentUser =
      this.storageService
        .getCurrentUser();

    this.currentRoleId =
      Number(
        currentUser?.maQuyen,
      ) || 0;

    this.isSelfServiceView =
      this.currentRoleId ===
      MA_QUYEN.NHAN_VIEN &&
      Number(
        currentUser?.maNV,
      ) === this.employeeId;

    if (
      !this.visibleTabs.some(
        tab =>
          tab.id ===
          this.activeTab,
      )
    ) {
      this.activeTab =
        this.visibleTabs[0]
          ?.id ??
        'personal';
    }

    this.loadEmployee();
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

  get selectedContract():
    EmployeeContractHistoryItem | null {

    if (
      this.selectedContractId ===
      null
    ) {
      return null;
    }

    return (
      this.contracts.find(
        contract =>
          contract.maHD ===
          this.selectedContractId,
      ) ??
      null
    );
  }

  get totalAttendanceHours():
    number {

    return this.attendanceRecords
      .reduce(
        (
          total,
          record,
        ) =>
          total +
          record.soGioLam,
        0,
      );
  }

  get latestPayroll():
    EmployeePayrollHistoryItem | null {

    return (
      this.payrollRecords[0] ??
      null
    );
  }

  get historyWarningMessages():
    string[] {

    return [
      this.contractErrorMessage,
      this.leaveErrorMessage,
      this.payrollErrorMessage,
      this.allowanceErrorMessage,
      this.historyErrorMessage,
    ].filter(
      message =>
        Boolean(
          message,
        ),
    );
  }

  changeTab(
    tabId:
      EmployeeProfileTab,
  ): void {

    if (
      this.isLoading ||
      !this.visibleTabs.some(
        tab =>
          tab.id ===
          tabId,
      )
    ) {
      return;
    }

    this.activeTab =
      tabId;
  }

  selectContract(
    maHD:
      number,
  ): void {

    if (
      this.isLoading
    ) {
      return;
    }

    const exists =
      this.contracts.some(
        contract =>
          contract.maHD ===
          maHD,
      );

    if (
      !exists
    ) {
      return;
    }

    this.selectedContractId =
      maHD;
  }

  formatContractCode(
    maHD:
      number,
  ): string {

    return `HD-${maHD
      .toString()
      .padStart(
        5,
        '0',
      )}`;
  }

  viewSelectedContract():
    void {

    const contract =
      this.selectedContract;

    if (
      !contract ||
      !this.canManageContracts
    ) {
      return;
    }

    void this.router
      .navigate([
        '/contracts',
        contract.maHD,
      ]);
  }

  canRenewContract(
    contract: EmployeeContractHistoryItem,
  ): boolean {
    if (!contract.ngayKetThuc) {
      return false;
    }

    if (!contract.isCurrent) {
      return true;
    }

    const endDate = new Date(
      contract.ngayKetThuc,
    );

    if (
      Number.isNaN(
        endDate.getTime(),
      )
    ) {
      return false;
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    return (
      endDate.getTime() <
      today.getTime()
    );
  }

  renewSelectedContract():
    void {

    const contract =
      this.selectedContract;

    if (
      !contract ||
      !this.canManageContracts ||
      !this.canRenewContract(
        contract,
      )
    ) {
      return;
    }

    void this.router.navigate(
      [
        '/contracts',
        'add',
      ],
      {
        queryParams: {
          renewFrom:
            contract.maHD,
        },
      },
    );
  }

  editProfile():
    void {

    if (
      this.isLoading ||
      !this.canEditEmployeeProfile ||
      this.employeeId <=
      0
    ) {
      return;
    }

    void this.router
      .navigate([
        '/employees',
        this.employeeId,
        'edit',
      ]);
  }

  manageAllowances():
    void {

    if (
      this.isLoading ||
      !this.canManageAllowances ||
      this.employeeId <=
      0
    ) {
      return;
    }

    void this.router
      .navigate(
        [
          '/employees',
          this.employeeId,
          'edit',
        ],
        {
          queryParams: {
            tab: 'allowances',
          },
        },
      );
  }

  isAllowanceActive(
    status:
      EmployeeAllowanceHistoryItem['trangThai'],
  ): boolean {

    return (
      status ===
      NHAN_VIEN_PHU_CAP_TRANG_THAI
        .DANG_AP_DUNG
    );
  }

  retry():
    void {

    if (
      this.isLoading ||
      this.employeeId <=
      0
    ) {
      return;
    }

    this.loadEmployee();
  }

  printProfile():
    void {

    if (
      this.isLoading ||
      this.employeeId <=
      0
    ) {
      return;
    }

    if (
      typeof window ===
      'undefined'
    ) {
      return;
    }

    window.print();
  }

  private loadEmployee():
    void {

    this.isLoading =
      true;

    this.errorMessage =
      '';

    this.contractErrorMessage =
      '';

    this.attendanceErrorMessage =
      '';

    this.leaveErrorMessage =
      '';

    this.payrollErrorMessage =
      '';

    this.allowanceErrorMessage =
      '';

    this.historyErrorMessage =
      '';

    this.changeDetectorRef
      .markForCheck();

    forkJoin({
      employee:
        this.nhanVienService
          .getById(
            this.employeeId,
          ),

      contracts:
        (
          this.canViewContractData
            ? this.isSelfServiceView
              ? this.hopDongService.getMe()
              : this.hopDongService.getAll()
            : of([] as HopDong[])
        )
          .pipe(
            catchError(
              (
                error:
                  unknown,
              ) => {

                this.contractErrorMessage =
                  this.getApiErrorMessage(
                    error,
                    'Không thể tải lịch sử hợp đồng.',
                  );

                return of(
                  [] as HopDong[],
                );
              },
            ),
          ),

      contractTypes:
        (
          this.canViewContractData
            ? this.hopDongService.getContractTypes()
            : of([])
        )
          .pipe(
            catchError(
              () => {

                return of(
                  [],
                );
              },
            ),
          ),

      attendance:
        (
          this.canViewAttendanceData
            ? this.isSelfServiceView
              ? this.chamCongService.getMe()
              : this.chamCongService.getAll()
            : of([] as ChamCong[])
        )
          .pipe(
            catchError(
              (
                error:
                  unknown,
              ) => {

                this.attendanceErrorMessage =
                  this.getApiErrorMessage(
                    error,
                    'Không thể tải dữ liệu chấm công.',
                  );

                return of(
                  [] as ChamCong[],
                );
              },
            ),
          ),

      shifts:
        (
          this.canViewAttendanceData
            ? this.chamCongService.getShiftTypes()
            : of([] as LoaiCa[])
        )
          .pipe(
            catchError(
              () => {

                return of(
                  [] as LoaiCa[],
                );
              },
            ),
          ),

      leaves:
        (
          this.canViewAttendanceData
            ? this.isSelfServiceView
              ? this.nghiPhepService.getMe()
              : this.nghiPhepService.getAll()
            : of([] as NghiPhep[])
        )
          .pipe(
            catchError(
              (
                error:
                  unknown,
              ) => {

                this.leaveErrorMessage =
                  this.getApiErrorMessage(
                    error,
                    'Không thể tải dữ liệu nghỉ phép.',
                  );

                return of(
                  [] as NghiPhep[],
                );
              },
            ),
          ),

      leaveTypes:
        (
          this.canViewAttendanceData
            ? this.nghiPhepService.getLeaveTypes()
            : of([] as LoaiNghiPhep[])
        )
          .pipe(
            catchError(
              () => {

                return of(
                  [] as LoaiNghiPhep[],
                );
              },
            ),
          ),

      payrolls:
        (
          this.canViewSalaryData
            ? this.isSelfServiceView
              ? this.bangLuongService.getMe()
              : this.bangLuongService.getAll()
            : of([] as BangLuong[])
        )
          .pipe(
            catchError(
              (
                error:
                  unknown,
              ) => {

                this.payrollErrorMessage =
                  this.getApiErrorMessage(
                    error,
                    'Không thể tải dữ liệu bảng lương.',
                  );

                return of(
                  [] as BangLuong[],
                );
              },
            ),
          ),

      employeeAllowances:
        (
          this.canViewSalaryData
            ? this.isSelfServiceView
              ? this.nhanVienPhuCapService.getMe()
              : this.nhanVienPhuCapService.getAll()
            : of([] as NhanVienPhuCap[])
        )
          .pipe(
            catchError(
              (
                error:
                  unknown,
              ) => {

                this.allowanceErrorMessage =
                  this.getApiErrorMessage(
                    error,
                    'Không thể tải phụ cấp của nhân viên.',
                  );

                return of(
                  [] as NhanVienPhuCap[],
                );
              },
            ),
          ),

      allowanceTypes:
        (
          this.canViewSalaryData
            ? this.phuCapService.getAll()
            : of([] as PhuCap[])
        )
          .pipe(
            catchError(
              (
                error:
                  unknown,
              ) => {

                this.allowanceErrorMessage =
                  this.getApiErrorMessage(
                    error,
                    'Không thể tải danh mục phụ cấp.',
                  );

                return of(
                  [] as PhuCap[],
                );
              },
            ),
          ),

      rewardsDiscipline:
        (
          this.canViewHistoryData
            ? this.isSelfServiceView
              ? this.khenThuongKyLuatService.getMe()
              : this.khenThuongKyLuatService.getAll()
            : of([] as KhenThuongKyLuat[])
        )
          .pipe(
            catchError(
              (
                error:
                  unknown,
              ) => {

                this.historyErrorMessage =
                  this.getApiErrorMessage(
                    error,
                    'Không thể tải dữ liệu khen thưởng, kỷ luật.',
                  );

                return of(
                  [] as KhenThuongKyLuat[],
                );
              },
            ),
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
          employee,
          contracts,
          contractTypes,
          attendance,
          shifts,
          leaves,
          leaveTypes,
          payrolls,
          employeeAllowances,
          allowanceTypes,
          rewardsDiscipline,
        }) => {
          this.employee =
            this.mapEmployee(
              employee,
            );

          const contractTypeNames =
            new Map<
              number,
              string
            >(
              contractTypes.map(
                contractType => [
                  contractType.maLoaiHD,
                  contractType.tenLoaiHD,
                ] as [
                    number,
                    string,
                  ],
              ),
            );

          this.contracts =
            this.mapContractHistory(
              contracts.filter(
                contract =>
                  contract.maNV ===
                  this.employeeId,
              ),
              contractTypeNames,
            );

          const currentContract =
            this.contracts.find(
              contract =>
                contract.isCurrent,
            );

          const latestContract =
            this.contracts[
            this.contracts.length -
            1
            ];

          const requestedContract =
            this.requestedContractId ===
              null
              ? null
              : this.contracts.find(
                contract =>
                  contract.maHD ===
                  this.requestedContractId,
              ) ??
              null;

          this.selectedContractId =
            requestedContract?.maHD ??
            currentContract?.maHD ??
            latestContract?.maHD ??
            null;

          this.requestedContractId =
            null;

          const shiftNames =
            new Map<
              number,
              string
            >(
              shifts.map(
                shift => [
                  shift.maCa,
                  shift.tenCa,
                ],
              ),
            );

          this.attendanceRecords =
            this.mapAttendanceHistory(
              attendance.filter(
                record =>
                  record.maNV ===
                  this.employeeId,
              ),
              shiftNames,
            );

          const leaveTypeNames =
            new Map<
              number,
              string
            >(
              leaveTypes.map(
                leaveType => [
                  leaveType.maLoaiNP,
                  leaveType.tenLoaiNP,
                ],
              ),
            );

          this.leaveRequests =
            this.mapLeaveHistory(
              leaves.filter(
                leave =>
                  leave.maNV ===
                  this.employeeId,
              ),
              leaveTypeNames,
            );

          this.payrollRecords =
            this.mapPayrollHistory(
              payrolls.filter(
                payroll =>
                  payroll.maNV ===
                  this.employeeId,
              ),
            );

          const allowanceTypeMap =
            new Map<
              number,
              PhuCap
            >(
              allowanceTypes.map(
                allowance => [
                  allowance.maPC,
                  allowance,
                ],
              ),
            );

          this.allowances =
            this.mapAllowanceHistory(
              employeeAllowances.filter(
                allowance =>
                  allowance.maNV ===
                  this.employeeId,
              ),
              allowanceTypeMap,
            );

          this.historyItems =
            this.buildProfileHistory(
              employee.ngayVaoLam,
              this.contracts,
              this.leaveRequests,
              this.payrollRecords,
              this.allowances,
              rewardsDiscipline.filter(
                decision =>
                  decision.maNV ===
                  this.employeeId,
              ),
            );

          this.changeDetectorRef
            .markForCheck();
        },

        error: (
          error:
            unknown,
        ) => {

          this.employee =
            this.createEmptyEmployee();

          this.employee.id =
            this.employeeId;

          this.contracts =
            [];

          this.attendanceRecords =
            [];

          this.leaveRequests =
            [];

          this.payrollRecords =
            [];

          this.allowances =
            [];

          this.historyItems =
            [];

          this.selectedContractId =
            null;

          this.errorMessage =
            this.getApiErrorMessage(
              error,
              'Không thể tải hồ sơ nhân viên.',
            );

          this.showToast(
            this.errorMessage,
          );
        },
      });
  }

  private buildProfileHistory(
    joinDate:
      string,

    contracts:
      EmployeeContractHistoryItem[],

    leaveRequests:
      EmployeeLeaveHistoryItem[],

    payrollRecords:
      EmployeePayrollHistoryItem[],

    allowances:
      EmployeeAllowanceHistoryItem[],

    rewardsDiscipline:
      KhenThuongKyLuat[],
  ): EmployeeProfileHistoryItem[] {

    const items:
      EmployeeProfileHistoryItem[] =
      [];

    if (
      joinDate
    ) {
      items.push({
        id:
          `employment-${this.employeeId}`,

        category:
          'employment',

        categoryLabel:
          'Nhân sự',

        dateLabel:
          this.formatDate(
            joinDate,
          ) ||
          'Chưa cập nhật',

        sortValue:
          this.getDateTime(
            joinDate,
          ),

        title:
          'Bắt đầu làm việc',

        description:
          'Ngày vào làm được ghi nhận trong hồ sơ nhân viên.',

        reference:
          this.formatEmployeeCode(
            this.employeeId,
          ),

        amount:
          null,
      });
    }

    contracts.forEach(
      contract => {
        items.push({
          id:
            `contract-start-${contract.maHD}`,

          category:
            'contract',

          categoryLabel:
            'Hợp đồng',

          dateLabel:
            this.formatDate(
              contract.ngayBatDau,
            ) ||
            'Chưa cập nhật',

          sortValue:
            this.getDateTime(
              contract.ngayBatDau,
            ),

          title:
            `Bắt đầu ${this.formatContractCode(
              contract.maHD,
            )}`,

          description:
            contract.tenLoaiHD,

          reference:
            this.formatContractCode(
              contract.maHD,
            ),

          amount:
            contract.luongCoBan,
        });

        if (
          contract.ngayKetThuc
        ) {
          items.push({
            id:
              `contract-end-${contract.maHD}`,

            category:
              'contract',

            categoryLabel:
              'Hợp đồng',

            dateLabel:
              this.formatDate(
                contract.ngayKetThuc,
              ) ||
              'Chưa cập nhật',

            sortValue:
              this.getDateTime(
                contract.ngayKetThuc,
              ),

            title:
              `Kết thúc ${this.formatContractCode(
                contract.maHD,
              )}`,

            description:
              contract.tenLoaiHD,

            reference:
              this.formatContractCode(
                contract.maHD,
              ),

            amount:
              null,
          });
        }
      },
    );

    leaveRequests.forEach(
      leaveRequest => {
        const sameDay =
          leaveRequest.tuNgay ===
          leaveRequest.denNgay;

        const startLabel =
          this.formatDate(
            leaveRequest.tuNgay,
          ) ||
          'Chưa cập nhật';

        const endLabel =
          this.formatDate(
            leaveRequest.denNgay,
          ) ||
          'Chưa cập nhật';

        const descriptionParts = [
          `Trạng thái: ${leaveRequest.trangThai}`,
          leaveRequest.lyDo
            ? `Lý do: ${leaveRequest.lyDo}`
            : '',
        ].filter(
          Boolean,
        );

        items.push({
          id:
            `leave-${leaveRequest.maNP}`,

          category:
            'leave',

          categoryLabel:
            'Nghỉ phép',

          dateLabel:
            sameDay
              ? startLabel
              : `${startLabel} - ${endLabel}`,

          sortValue:
            this.getDateTime(
              leaveRequest.tuNgay,
            ),

          title:
            leaveRequest.tenLoaiNP,

          description:
            descriptionParts.join(
              ' · ',
            ),

          reference:
            `NP-${leaveRequest.maNP
              .toString()
              .padStart(
                4,
                '0',
              )}`,

          amount:
            null,
        });
      },
    );

    allowances.forEach(
      allowance => {
        const descriptionParts = [
          `Trạng thái: ${allowance.trangThai}`,
          allowance.moTa
            ? allowance.moTa
            : '',
        ].filter(
          Boolean,
        );

        items.push({
          id:
            `allowance-${allowance.maPC}-${allowance.ngayApDung}`,

          category:
            'allowance',

          categoryLabel:
            'Phụ cấp',

          dateLabel:
            this.formatDate(
              allowance.ngayApDung,
            ) ||
            'Chưa cập nhật',

          sortValue:
            this.getDateTime(
              allowance.ngayApDung,
            ),

          title:
            `Áp dụng ${allowance.tenPC}`,

          description:
            descriptionParts.join(
              ' · ',
            ),

          reference:
            `PC-${allowance.maPC
              .toString()
              .padStart(
                4,
                '0',
              )}`,

          amount:
            allowance.soTien,
        });
      },
    );

    payrollRecords.forEach(
      payroll => {
        const sortDate =
          new Date(
            payroll.nam,
            Math.max(
              payroll.thang - 1,
              0,
            ),
            1,
          );

        items.push({
          id:
            `payroll-${payroll.maLuong}`,

          category:
            'payroll',

          categoryLabel:
            'Bảng lương',

          dateLabel:
            `Tháng ${payroll.thang}/${payroll.nam}`,

          sortValue:
            Number.isNaN(
              sortDate.getTime(),
            )
              ? 0
              : sortDate.getTime(),

          title:
            `Bảng lương tháng ${payroll.thang}/${payroll.nam}`,

          description:
            `Số ngày công: ${payroll.soNgayCong}`,

          reference:
            `BL-${payroll.maLuong
              .toString()
              .padStart(
                5,
                '0',
              )}`,

          amount:
            payroll.tongLuong,
        });
      },
    );

    rewardsDiscipline.forEach(
      decision => {
        const isDiscipline =
          decision.loai ===
          KHEN_THUONG_KY_LUAT_LOAI
            .KY_LUAT;

        items.push({
          id:
            `reward-discipline-${decision.maKTKL}`,

          category:
            isDiscipline
              ? 'discipline'
              : 'reward',

          categoryLabel:
            isDiscipline
              ? 'Kỷ luật'
              : 'Khen thưởng',

          dateLabel:
            this.formatDate(
              decision.ngayQuyetDinh,
            ) ||
            'Chưa cập nhật',

          sortValue:
            this.getDateTime(
              decision.ngayQuyetDinh,
            ),

          title:
            decision.loai,

          description:
            decision.lyDo ||
            'Không có lý do.',

          reference:
            `KTKL-${decision.maKTKL
              .toString()
              .padStart(
                5,
                '0',
              )}`,

          amount:
            decision.soTien >
              0
              ? decision.soTien
              : null,
        });
      },
    );

    return items
      .sort(
        (
          a,
          b,
        ) => {
          const dateComparison =
            b.sortValue -
            a.sortValue;

          if (
            dateComparison !==
            0
          ) {
            return dateComparison;
          }

          return a.id
            .localeCompare(
              b.id,
            );
        },
      );
  }

  private mapPayrollHistory(
    payrolls:
      BangLuong[],
  ): EmployeePayrollHistoryItem[] {

    return [...payrolls]
      .sort(
        (
          first,
          second,
        ) => {
          const yearComparison =
            second.nam -
            first.nam;

          if (
            yearComparison !==
            0
          ) {
            return yearComparison;
          }

          const monthComparison =
            second.thang -
            first.thang;

          if (
            monthComparison !==
            0
          ) {
            return monthComparison;
          }

          return (
            second.maLuong -
            first.maLuong
          );
        },
      )
      .map(
        payroll => ({
          maLuong:
            payroll.maLuong,

          thang:
            payroll.thang,

          nam:
            payroll.nam,

          luongCoBan:
            Number(
              payroll.luongCoBan ??
              0,
            ),

          tongPhuCap:
            Number(
              payroll.tongPhuCap ??
              0,
            ),

          tongThuong:
            Number(
              payroll.tongThuong ??
              0,
            ),

          tongKhauTru:
            Number(
              payroll.tongKhauTru ??
              0,
            ),

          soNgayCong:
            Number(
              payroll.soNgayCong ??
              0,
            ),

          tongLuong:
            Number(
              payroll.tongLuong ??
              0,
            ),
        }),
      );
  }

  private mapAllowanceHistory(
    employeeAllowances:
      NhanVienPhuCap[],

    allowanceTypes:
      Map<number, PhuCap>,
  ): EmployeeAllowanceHistoryItem[] {

    return [...employeeAllowances]
      .sort(
        (
          first,
          second,
        ) => {
          const dateComparison =
            this.getDateTime(
              second.ngayApDung,
            ) -
            this.getDateTime(
              first.ngayApDung,
            );

          if (
            dateComparison !==
            0
          ) {
            return dateComparison;
          }

          return (
            second.maPC -
            first.maPC
          );
        },
      )
      .map(
        employeeAllowance => {
          const allowance =
            allowanceTypes.get(
              employeeAllowance.maPC,
            );

          return {
            maPC:
              employeeAllowance.maPC,

            tenPC:
              allowance?.tenPC ??
              `Phụ cấp #${employeeAllowance.maPC}`,

            soTien:
              Number(
                allowance?.soTien ??
                0,
              ),

            moTa:
              allowance?.moTa ??
              null,

            ngayApDung:
              employeeAllowance.ngayApDung,

            trangThai:
              employeeAllowance.trangThai,
          };
        },
      );
  }

  private mapAttendanceHistory(
    records:
      ChamCong[],

    shiftNames:
      Map<number, string>,
  ): EmployeeAttendanceHistoryItem[] {

    return [...records]
      .sort(
        (
          first,
          second,
        ) => {
          const dateComparison =
            this.getDateTime(
              second.ngayChamCong,
            ) -
            this.getDateTime(
              first.ngayChamCong,
            );

          if (
            dateComparison !==
            0
          ) {
            return dateComparison;
          }

          return (
            second.maCC -
            first.maCC
          );
        },
      )
      .map(
        record => ({
          maCC:
            record.maCC,

          maCa:
            record.maCa,

          tenCa:
            shiftNames.get(
              record.maCa,
            ) ??
            `Ca #${record.maCa}`,

          ngayChamCong:
            record.ngayChamCong,

          gioVao:
            this.formatTime(
              record.gioVao,
            ),

          gioRa:
            this.formatTime(
              record.gioRa,
            ),

          soGioLam:
            Number(
              record.soGioLam ??
              0,
            ),

          trangThai:
            record.trangThai,

          ghiChu:
            record.ghiChu,
        }),
      );
  }

  private mapLeaveHistory(
    leaveRequests:
      NghiPhep[],

    leaveTypeNames:
      Map<number, string>,
  ): EmployeeLeaveHistoryItem[] {

    return [...leaveRequests]
      .sort(
        (
          first,
          second,
        ) => {
          const dateComparison =
            this.getDateTime(
              second.tuNgay,
            ) -
            this.getDateTime(
              first.tuNgay,
            );

          if (
            dateComparison !==
            0
          ) {
            return dateComparison;
          }

          return (
            second.maNP -
            first.maNP
          );
        },
      )
      .map(
        leaveRequest => ({
          maNP:
            leaveRequest.maNP,

          maLoaiNP:
            leaveRequest.maLoaiNP,

          tenLoaiNP:
            leaveTypeNames.get(
              leaveRequest.maLoaiNP,
            ) ??
            `Loại nghỉ #${leaveRequest.maLoaiNP}`,

          tuNgay:
            leaveRequest.tuNgay,

          denNgay:
            leaveRequest.denNgay,

          lyDo:
            leaveRequest.lyDo,

          trangThai:
            leaveRequest.trangThai,

          nguoiDuyet:
            leaveRequest.nguoiDuyet,

          nguoiDuyetLabel:
            leaveRequest.nguoiDuyet
              ? this.formatEmployeeCode(
                leaveRequest.nguoiDuyet,
              )
              : 'Chưa có',
        }),
      );
  }

  private formatTime(
    value:
      string | null,
  ): string {

    if (
      !value
    ) {
      return '--';
    }

    const match =
      value.match(
        /^(\d{1,2}):(\d{2})/,
      );

    if (
      !match
    ) {
      return value;
    }

    return `${match[1].padStart(
      2,
      '0',
    )}:${match[2]}`;
  }

  private mapContractHistory(
    contracts:
      HopDong[],

    contractTypeNames:
      Map<number, string>,
  ): EmployeeContractHistoryItem[] {

    const sortedContracts =
      [...contracts]
        .sort(
          (
            a,
            b,
          ) => {
            const startComparison =
              this.getDateTime(
                a.ngayBatDau,
              ) -
              this.getDateTime(
                b.ngayBatDau,
              );

            if (
              startComparison !==
              0
            ) {
              return startComparison;
            }

            return (
              a.maHD -
              b.maHD
            );
          },
        );

    const latestContract =
      sortedContracts[
      sortedContracts.length -
      1
      ];

    return sortedContracts
      .map(
        contract => {
          const isLatest =
            latestContract
              ?.maHD ===
            contract.maHD;

          const backendExpired =
            contract.trangThai ===
            HOP_DONG_TRANG_THAI
              .HET_HIEU_LUC;

          const endedByDate =
            this.hasContractEnded(
              contract.ngayKetThuc,
            );

          const isCurrent =
            isLatest &&
            !backendExpired &&
            !endedByDate;

          return {
            maHD:
              contract.maHD,

            maNV:
              contract.maNV,

            maLoaiHD:
              contract.maLoaiHD,

            tenLoaiHD:
              contractTypeNames
                .get(
                  contract.maLoaiHD,
                ) ??
              `Loại hợp đồng #${contract.maLoaiHD}`,

            ngayBatDau:
              contract.ngayBatDau,

            ngayKetThuc:
              contract.ngayKetThuc,

            luongCoBan:
              contract.luongCoBan,

            trangThai:
              contract.trangThai,

            isCurrent,

            statusLabel:
              isCurrent
                ? 'Còn hiệu lực'
                : 'Hết hạn',
          };
        },
      );
  }

  private hasContractEnded(
    endDateValue:
      string | null,
  ): boolean {

    if (
      !endDateValue
    ) {
      return false;
    }

    const endDate =
      new Date(
        endDateValue,
      );

    if (
      Number.isNaN(
        endDate.getTime(),
      )
    ) {
      return false;
    }

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0,
    );

    endDate.setHours(
      0,
      0,
      0,
      0,
    );

    return (
      endDate.getTime() <
      today.getTime()
    );
  }

  private getDateTime(
    value:
      string,
  ): number {

    const date =
      new Date(
        value,
      );

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return 0;
    }

    return date.getTime();
  }

  private mapEmployee(
    employee:
      NhanVienChiTiet,
  ): EmployeeProfile {

    const fullName =
      employee.hoTen
        .trim();

    return {
      id:
        employee.maNV,

      initials:
        this.getInitials(
          fullName,
        ),

      avatarUrl:
        employee.hinhAnh ??
        '',

      employeeCode:
        this.formatEmployeeCode(
          employee.maNV,
        ),

      fullName,

      status:
        this.mapStatus(
          employee.trangThai,
        ),

      statusLabel:
        employee.trangThai,

      position:
        employee.tenCV ??
        'Chưa có chức vụ',

      department:
        employee.tenPB ??
        'Chưa phân phòng',

      joinDate:
        this.formatDate(
          employee.ngayVaoLam,
        ),

      personalEmail:
        employee.email ??
        '',

      phoneNumber:
        employee.sdt ??
        '',

      dateOfBirth:
        this.formatDate(
          employee.ngaySinh,
        ),

      gender:
        employee.gioiTinh ??
        '',

      identityNumber:
        employee.cccd ??
        '',

      permanentAddress:
        employee.diaChi ??
        '',
    };
  }

  private createEmptyEmployee():
    EmployeeProfile {

    return {
      id:
        0,

      initials:
        'NV',

      avatarUrl:
        '',

      employeeCode:
        '',

      fullName:
        '',

      status:
        'working',

      statusLabel:
        '',

      position:
        '',

      department:
        '',

      joinDate:
        '',

      personalEmail:
        '',

      phoneNumber:
        '',

      dateOfBirth:
        '',

      gender:
        '',

      identityNumber:
        '',

      permanentAddress:
        '',
    };
  }

  private mapStatus(
    status:
      string,
  ): EmployeeProfile[
    'status'
    ] {

    switch (
    status
    ) {
      case NHAN_VIEN_TRANG_THAI
        .TAM_NGHI:
        return 'on-leave';

      case NHAN_VIEN_TRANG_THAI
        .DA_NGHI_VIEC:
        return 'resigned';

      case NHAN_VIEN_TRANG_THAI
        .DANG_LAM_VIEC:
      default:
        return 'working';
    }
  }

  private isProfileTab(
    value:
      string | null,
  ): value is EmployeeProfileTab {

    if (
      !value
    ) {
      return false;
    }

    return this.tabs
      .some(
        tab =>
          tab.id ===
          value,
      );
  }

  private formatEmployeeCode(
    maNV:
      number,
  ): string {

    return `NV-${maNV
      .toString()
      .padStart(
        4,
        '0',
      )}`;
  }

  private getInitials(
    fullName:
      string,
  ): string {

    const words =
      fullName
        .split(
          /\s+/,
        )
        .filter(
          Boolean,
        );

    if (
      words.length ===
      0
    ) {
      return 'NV';
    }

    if (
      words.length ===
      1
    ) {
      return words[
        0
      ]
        .slice(
          0,
          2,
        )
        .toUpperCase();
    }

    return `${words[0][0]}${words[
      words.length -
      1
    ][0]}`
      .toUpperCase();
  }

  private formatDate(
    value:
      string,
  ): string {

    if (
      !value
    ) {
      return '';
    }

    const date =
      new Date(
        value,
      );

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return value;
    }

    return new Intl
      .DateTimeFormat(
        'vi-VN',
      )
      .format(
        date,
      );
  }

  private getApiErrorMessage(
    error:
      unknown,

    fallback:
      string,
  ): string {

    if (
      error instanceof
      HttpErrorResponse
    ) {
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
              value => {
                if (
                  Array.isArray(
                    value,
                  )
                ) {
                  return value
                    .map(
                      item =>
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
          return 'Không thể kết nối đến hệ thống.';

        case 400:
          return 'Yêu cầu không hợp lệ.';

        case 401:
          return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';

        case 403:
          return 'Bạn không có quyền thực hiện thao tác này.';

        case 404:
          return 'Không tìm thấy dữ liệu cần thiết.';

        case 409:
          return 'Không thể thực hiện do dữ liệu đang bị xung đột.';
      }
    }

    if (
      error instanceof
      Error &&
      error.message
    ) {
      return error.message;
    }

    return fallback;
  }

  private showToast(
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
