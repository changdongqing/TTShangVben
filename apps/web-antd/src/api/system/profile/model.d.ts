export interface Dept {
  deptId: number;
  parentId: number;
  parentName?: any;
  ancestors: string;
  deptName: string;
  orderNum: number;
  leader: string;
  phone?: any;
  email: string;
  status: string;
  creationTime?: any;
}

export interface Role {
  roleId: number;
  roleName: string;
  roleKey: string;
  roleSort: number;
  dataScope: string;
  menuCheckStrictly?: any;
  deptCheckStrictly?: any;
  status: string;
  remark: string;
  creationTime?: any;
  flag: boolean;
  superAdmin: boolean;
}

export interface User {
  userId: number;
  tenantId: string;
  deptId: number;
  userName: string;
  nick: string;
  userType: string;
  email: string;
  phone: string;
  sex: string;
  avatar: string;
  status: string;
  loginIp: string;
  loginDate: string;
  remark: string;
  creationTime: string;
  dept: Dept;
  roles: Role[];
  roleIds?: string[];
  postIds?: string[];
  roleId: number;
  deptName: string;
}

export interface UpdatePasswordParam {
  oldPassword: string;
  newPassword: string;
}

interface FileCallBack {
  name: string;
  file: Blob;
  filename: string;
}
