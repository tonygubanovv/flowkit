interface DeviceInfo {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
  coarsePointer: boolean;
  finePointer: boolean;
}

export const isUnsupportedDevice = (device: DeviceInfo): boolean =>
  /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(device.userAgent)
  || (device.platform === 'MacIntel' && device.maxTouchPoints > 1)
  || (device.maxTouchPoints > 0 && device.coarsePointer && !device.finePointer);
