<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { User } from '#/api/system/user/model';

import { ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { preferences } from '@vben/preferences';
import { getVxePopupContainer } from '@vben/utils';

import {
  Avatar,
  Dropdown,
  Menu,
  MenuItem,
  message,
  Modal,
  Popconfirm,
  Space,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid, vxeCheckboxChecked } from '#/adapter/vxe-table';
import {
  userAdd,
  userExport,
  userList,
  userRemove,
  userUpdate,
} from '#/api/system/user';
import { TableSwitch } from '#/components/table';
import { commonDownloadExcel } from '#/utils/file/download';

import { columns, querySchema } from './data';
import DeptTree from './dept-tree.vue';
import userDrawer from './user-drawer.vue';
import userImportModal from './user-import-modal.vue';
import userInfoModal from './user-info-modal.vue';
import userResetPwdModal from './user-reset-pwd-modal.vue';

// 跟踪待处理的更改
const pendingChanges = ref<{
  added: User[];
  modified: Set<string>;
  deleted: Set<string>;
}>({
  added: [],
  modified: new Set(),
  deleted: new Set(),
});

/**
 * 导入
 */
const [UserImpotModal, userImportModalApi] = useVbenModal({
  connectedComponent: userImportModal,
});

function handleImport() {
  userImportModalApi.open();
}

// 左边部门用
const selectDeptId = ref<string[]>([]);

const formOptions: VbenFormProps = {
  schema: querySchema(),
  commonConfig: {
    labelWidth: 80,
    componentProps: {
      allowClear: true,
    },
  },
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  handleReset: async () => {
    selectDeptId.value = [];

    const { formApi, reload } = tableApi;
    await formApi.resetForm();
    const formValues = formApi.form.values;
    formApi.setLatestSubmissionValues(formValues);
    await reload(formValues);
  },
  // 日期选择格式化
  fieldMappingTime: [
    [
      'creationTime',
      ['startTime', 'endTime'],
      ['YYYY-MM-DD 00:00:00', 'YYYY-MM-DD 23:59:59'],
    ],
  ],
};

const gridOptions: VxeGridProps = {
  checkboxConfig: {
    // 高亮
    highlight: true,
    // 翻页时保留选中状态
    reserve: true,
    // 点击行选中
    trigger: 'default',
    checkMethod: ({ row }) => row?.id !== 1,
  },
  columns,
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        // 部门树选择处理
        if (selectDeptId.value.length === 1) {
          formValues.deptId = selectDeptId.value[0];
        } else {
          Reflect.deleteProperty(formValues, 'deptId');
        }

        return await userList({
          SkipCount: page.currentPage,
          MaxResultCount: page.pageSize,
          ...formValues,
        });
      },
    },
  },
  headerCellConfig: {
    height: 44,
  },
  cellConfig: {
    height: 48,
  },
  rowConfig: {
    keyField: 'id',
  },
  editConfig: {
    trigger: 'dblclick',
    mode: 'row',
    showStatus: true,
  },
  editRules: {
    userName: [{ required: true, message: '用户账号必填' }],
    nick: [{ required: true, message: '用户昵称必填' }],
    phone: [
      {
        pattern: /^1[3-9]\d{9}$/,
        message: '请输入正确的手机号码',
      },
    ],
    email: [
      {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: '请输入正确的邮箱',
      },
    ],
  },
  id: 'system-user-index',
};
// @ts-expect-error 类型实例化过深
const [BasicTable, tableApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});

const [UserDrawer, userDrawerApi] = useVbenDrawer({
  connectedComponent: userDrawer,
});

function handleAdd() {
  // 添加新行到表格中（本地操作，不立即保存）
  const newUser: Partial<User> = {
    id: `temp_${Date.now()}`, // 临时ID
    userName: '',
    nick: '',
    state: true,
    sex: 'Man',
    creationTime: new Date().toISOString(),
  };
  
  tableApi.grid.insertAt(newUser, 0);
  pendingChanges.value.added.push(newUser as User);
  
  // 进入编辑模式
  setTimeout(() => {
    tableApi.grid.setActiveRow(tableApi.grid.getRowByIndex(0));
    tableApi.grid.setEditRow(tableApi.grid.getRowByIndex(0));
  }, 100);
}

function handleEdit(row: User) {
  userDrawerApi.setData({ id: row.id });
  userDrawerApi.open();
}

async function handleDelete(row: User) {
  await userRemove([row.id]);
  await tableApi.query();
}

function handleMultiDelete() {
  const rows = tableApi.grid.getCheckboxRecords();
  
  // 将选中的行标记为删除
  rows.forEach((row: User) => {
    if (!row.id.toString().startsWith('temp_')) {
      // 不是新增的行，标记为删除
      pendingChanges.value.deleted.add(row.id);
    } else {
      // 新增的行，从添加列表中移除
      const index = pendingChanges.value.added.findIndex(u => u.id === row.id);
      if (index !== -1) {
        pendingChanges.value.added.splice(index, 1);
      }
    }
    // 从表格中移除
    tableApi.grid.remove(row);
  });
  
  message.success(`已标记${rows.length}条记录为删除，点击保存按钮后生效`);
}

function handleDownloadExcel() {
  commonDownloadExcel(userExport, '用户管理', tableApi.formApi.form.values, {
    fieldMappingTime: formOptions.fieldMappingTime,
  });
}

// 批量保存所有更改
async function handleSave() {
  const hasChanges = 
    pendingChanges.value.added.length > 0 ||
    pendingChanges.value.modified.size > 0 ||
    pendingChanges.value.deleted.size > 0;
    
  if (!hasChanges) {
    message.info('没有需要保存的更改');
    return;
  }

  Modal.confirm({
    title: '确认保存',
    content: `即将保存以下更改：\n新增: ${pendingChanges.value.added.length} 条\n修改: ${pendingChanges.value.modified.size} 条\n删除: ${pendingChanges.value.deleted.size} 条`,
    onOk: async () => {
      try {
        // 1. 处理删除
        if (pendingChanges.value.deleted.size > 0) {
          await userRemove(Array.from(pendingChanges.value.deleted));
        }

        // 2. 处理新增
        for (const user of pendingChanges.value.added) {
          const userData = { ...user };
          delete userData.id; // 移除临时ID
          await userAdd(userData);
        }

        // 3. 处理修改
        const allRows = tableApi.grid.getTableData().fullData;
        for (const userId of pendingChanges.value.modified) {
          const row = allRows.find((r: User) => r.id === userId);
          if (row && !row.id.toString().startsWith('temp_')) {
            await userUpdate(row);
          }
        }

        // 清空待处理更改
        pendingChanges.value = {
          added: [],
          modified: new Set(),
          deleted: new Set(),
        };

        message.success('保存成功');
        await tableApi.query();
      } catch (error) {
        message.error('保存失败');
        console.error(error);
      }
    },
  });
}

// 监听行编辑完成事件
function handleEditClosed({ row }: { row: User }) {
  if (!row.id.toString().startsWith('temp_')) {
    // 已存在的行，标记为修改
    pendingChanges.value.modified.add(row.id);
  }
}

const [UserInfoModal, userInfoModalApi] = useVbenModal({
  connectedComponent: userInfoModal,
});
function handleUserInfo(row: User) {
  userInfoModalApi.setData({ userId: row.id });
  userInfoModalApi.open();
}

const [UserResetPwdModal, userResetPwdModalApi] = useVbenModal({
  connectedComponent: userResetPwdModal,
});

function handleResetPwd(record: User) {
  userResetPwdModalApi.setData({ record });
  userResetPwdModalApi.open();
}

const { hasAccessByCodes } = useAccess();
</script>

<template>
  <Page :auto-content-height="true">
    <div class="flex h-full gap-[8px]">
      <DeptTree
        v-model:select-dept-id="selectDeptId"
        class="w-[260px]"
        @reload="() => tableApi.reload()"
        @select="() => tableApi.reload()"
      />
      <BasicTable class="flex-1 overflow-hidden" table-title="用户列表" @edit-closed="handleEditClosed">
        <template #toolbar-tools>
          <Space>
            <a-button
              v-access:code="['system:user:export']"
              @click="handleDownloadExcel"
            >
              {{ $t('pages.common.export') }}
            </a-button>
            <a-button
              v-access:code="['system:user:import']"
              @click="handleImport"
            >
              {{ $t('pages.common.import') }}
            </a-button>
            <a-button
              :disabled="!vxeCheckboxChecked(tableApi)"
              danger
              type="primary"
              v-access:code="['system:user:remove']"
              @click="handleMultiDelete"
            >
              {{ $t('pages.common.delete') }}
            </a-button>
            <a-button
              type="primary"
              v-access:code="['system:user:add']"
              @click="handleAdd"
            >
              {{ $t('pages.common.add') }}
            </a-button>
            <a-button
              type="primary"
              v-access:code="['system:user:edit']"
              @click="handleSave"
            >
              保存
            </a-button>
          </Space>
        </template>
        <template #avatar="{ row }">
          <!-- 可能要判断空字符串情况 所以没有使用?? -->
          <Avatar :src="row.icon || preferences.app.defaultAvatar" />
        </template>
        <template #deptName="{ row }">
          {{ row.deptName || '暂无' }}
        </template>
        <template #sex="{ row }">
          {{ row.sex === 'Man' ? '男' : row.sex === 'Woman' ? '女' : '未知' }}
        </template>
        <template #posts="{ row }">
          <div v-if="row.posts && row.posts.length > 0" class="flex flex-wrap gap-0.5">
            <Tag v-for="item in row.posts" :key="item.postId" size="small">
              {{ item.postName }}
            </Tag>
          </div>
          <span v-else>暂无</span>
        </template>
        <template #roles="{ row }">
          <div v-if="row.roles && row.roles.length > 0" class="flex flex-wrap gap-0.5">
            <Tag v-for="item in row.roles" :key="item.roleId" size="small" color="blue">
              {{ item.roleName }}
            </Tag>
          </div>
          <span v-else>暂无</span>
        </template>
        <template #status="{ row }">
          <TableSwitch
            v-model:value="row.state"
            :api="() => userUpdate(row)"
            :disabled="
              row.id === '1' || !hasAccessByCodes(['system:user:edit'])
            "
            @reload="() => tableApi.query()"
          />
        </template>
        <template #action="{ row }">
          <template v-if="row.id !== '1'">
            <Dropdown placement="bottomRight">
              <template #overlay>
                <Menu>
                  <MenuItem key="1" @click="handleUserInfo(row)">
                    用户信息
                  </MenuItem>
                  <span v-access:code="['system:user:resetPwd']">
                    <MenuItem key="2" @click="handleResetPwd(row)">
                      重置密码
                    </MenuItem>
                  </span>
                </Menu>
              </template>
              <a-button size="small" type="link">
                {{ $t('pages.common.more') }}
              </a-button>
            </Dropdown>
          </template>
        </template>
      </BasicTable>
    </div>
    <UserImpotModal @reload="tableApi.query()" />
    <UserDrawer @reload="tableApi.query()" />
    <UserInfoModal />
    <UserResetPwdModal />
  </Page>
</template>
