import {
    Injectable,
} from '@angular/core';

import {
    LoginData,
} from '../models/login-response.model';


@Injectable({
    providedIn: 'root',
})
export class StorageService {

    private readonly tokenKey =
        'hrm_access_token';

    private readonly userKey =
        'hrm_current_user';


    /*
     * ============================
     * SAVE AUTH SESSION
     * ============================
     */

    saveAuthSession(
        data:
            LoginData,

        rememberMe:
            boolean,
    ): void {

        if (
            !this.canUseStorage()
        ) {

            return;
        }


        this.clearAuthSession();


        const storage =
            rememberMe
                ? localStorage
                : sessionStorage;


        storage.setItem(
            this.tokenKey,
            data.accessToken,
        );


        storage.setItem(
            this.userKey,
            JSON.stringify(
                data,
            ),
        );
    }


    /*
     * ============================
     * TOKEN
     * ============================
     */

    getToken():
        string | null {

        if (
            !this.canUseStorage()
        ) {

            return null;
        }


        return (
            localStorage
                .getItem(
                    this.tokenKey,
                ) ??

            sessionStorage
                .getItem(
                    this.tokenKey,
                )
        );
    }


    /*
     * ============================
     * CURRENT USER
     * ============================
     */

    getCurrentUser():
        LoginData | null {

        if (
            !this.canUseStorage()
        ) {

            return null;
        }


        const rawUser =
            localStorage
                .getItem(
                    this.userKey,
                ) ??

            sessionStorage
                .getItem(
                    this.userKey,
                );


        if (
            !rawUser
        ) {

            return null;
        }


        try {

            return JSON.parse(
                rawUser,
            ) as LoginData;

        } catch {

            this.clearAuthSession();


            return null;
        }
    }


    /*
     * ============================
     * HEADER USER NAME
     *
     * Login API hiện chỉ trả
     * tenDangNhap, không trả hoTen.
     *
     * Vì vậy tuyệt đối không dùng
     * tên nhân viên hard-code.
     * ============================
     */

    getCurrentUserDisplayName():
        string {

        const currentUser =
            this.getCurrentUser();


        const username =
            currentUser
                ?.tenDangNhap
                ?.trim();


        return (
            username ||
            'Tài khoản'
        );
    }


    /*
     * ============================
     * HEADER ROLE
     * ============================
     */

    getCurrentUserRoleName():
        string {

        const currentUser =
            this.getCurrentUser();


        const roleName =
            currentUser
                ?.tenQuyen
                ?.trim();


        return (
            roleName ||
            'Người dùng'
        );
    }


    /*
     * ============================
     * HEADER INITIALS
     * ============================
     */

    getCurrentUserInitials():
        string {

        const displayName =
            this.getCurrentUserDisplayName()
                .trim();


        if (
            !displayName ||
            displayName ===
            'Tài khoản'
        ) {

            return 'TK';
        }


        const words =
            displayName
                .split(
                    /\s+/,
                )
                .filter(
                    Boolean,
                );


        /*
         * Username chỉ có một từ:
         * admin -> AD
         * phat -> PH
         */
        if (
            words.length ===
            1
        ) {

            return words[0]
                .slice(
                    0,
                    2,
                )
                .toUpperCase();
        }


        /*
         * Nếu username/tên có nhiều từ:
         * Châu Ngọc Phát -> NP
         */
        return words
            .slice(
                -2,
            )
            .map(
                (
                    word,
                ) =>
                    word
                        .charAt(
                            0,
                        ),
            )
            .join(
                '',
            )
            .toUpperCase();
    }


    /*
     * ============================
     * CURRENT ACCOUNT ID
     * ============================
     */

    getCurrentAccountId():
        number | null {

        const maTK =
            this.getCurrentUser()
                ?.maTK;


        return (
            Number.isInteger(
                maTK,
            ) &&

            Number(
                maTK,
            ) >
            0
        )
            ? Number(
                maTK,
            )
            : null;
    }


    /*
     * ============================
     * CURRENT EMPLOYEE ID
     * ============================
     */

    getCurrentEmployeeId():
        number | null {

        const maNV =
            this.getCurrentUser()
                ?.maNV;


        return (
            Number.isInteger(
                maNV,
            ) &&

            Number(
                maNV,
            ) >
            0
        )
            ? Number(
                maNV,
            )
            : null;
    }


    /*
     * ============================
     * CURRENT ROLE ID
     * ============================
     */

    getCurrentRoleId():
        number | null {

        const maQuyen =
            this.getCurrentUser()
                ?.maQuyen;


        return (
            Number.isInteger(
                maQuyen,
            ) &&

            Number(
                maQuyen,
            ) >
            0
        )
            ? Number(
                maQuyen,
            )
            : null;
    }


    /*
     * ============================
     * CLEAR AUTH ONLY
     * ============================
     */

    clearAuthSession():
        void {

        if (
            !this.canUseStorage()
        ) {

            return;
        }


        localStorage
            .removeItem(
                this.tokenKey,
            );


        localStorage
            .removeItem(
                this.userKey,
            );


        sessionStorage
            .removeItem(
                this.tokenKey,
            );


        sessionStorage
            .removeItem(
                this.userKey,
            );
    }


    /*
     * ============================
     * CLEAR ALL
     * ============================
     */

    clearAll():
        void {

        if (
            !this.canUseStorage()
        ) {

            return;
        }


        localStorage.clear();

        sessionStorage.clear();
    }


    /*
     * ============================
     * BROWSER STORAGE CHECK
     * ============================
     */

    private canUseStorage():
        boolean {

        return (
            typeof window !==
            'undefined'
        );
    }
}