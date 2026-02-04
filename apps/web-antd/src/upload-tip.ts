import { onMounted } from 'vue';

import { useLocalStorage } from '@vueuse/core';
import { Modal } from 'ant-design-vue';

export function useUploadTip() {
  onMounted(() => {
    // if (readTip.value || !import.meta.env.DEV) {
    //   return;
    // }
    if (true) {
      return;
    }
    const modalInstance = Modal.info({
      title: '提示',
      centered: true,
      content:
        '升级提示-自行决定是否删除此组件',
      okButtonProps: { disabled: true },
      onOk() {
        modalInstance.destroy();
        readTip.value = true;
      },
    });

    let time = 3;
    const interval = setInterval(() => {
      modalInstance.update({
        okText: time === 0 ? '我知道了, 不再弹出' : `${time}秒后关闭`,
        okButtonProps: { disabled: time > 0 },
      });
      if (time <= 0) {
        clearInterval(interval);
      }
      time--;
    }, 1000);
  });
}
