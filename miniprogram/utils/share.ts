/**
 * 分享工具函数
 */

/**
 * 生成分享内容
 * @param vehicle 车辆信息
 */
export function generateShareContent(vehicle: any) {
  return {
    title: `${vehicle.modelName} - 仅需¥${vehicle.dailyPrice}/天`,
    desc: `${vehicle.seatCount}座${vehicle.bedCount}床，评分${vehicle.rating}分`,
    path: `/pages/vehicle-detail/index?id=${vehicle.id}`,
    imageUrl: vehicle.images?.[0] || 'https://picsum.photos/400/300',
  };
}

/**
 * 微信好友分享
 */
export function shareToWechat(vehicle: any) {
  const shareContent = generateShareContent(vehicle);

  return new Promise((resolve, reject) => {
    uni.share({
      provider: 'weixin',
      scene: 'WXSceneSession',
      type: 0,
      href: shareContent.path,
      title: shareContent.title,
      summary: shareContent.desc,
      imageUrl: shareContent.imageUrl,
      success: (res) => {
        console.log('Share success:', res);
        resolve(res);
      },
      fail: (err) => {
        console.error('Share failed:', err);
        reject(err);
      },
    });
  });
}

/**
 * 微信朋友圈分享
 */
export function shareToMoments(vehicle: any) {
  const shareContent = generateShareContent(vehicle);

  return new Promise((resolve, reject) => {
    uni.share({
      provider: 'weixin',
      scene: 'WXSceneTimeline',
      type: 0,
      href: shareContent.path,
      title: shareContent.title,
      summary: shareContent.desc,
      imageUrl: shareContent.imageUrl,
      success: (res) => {
        console.log('Share to moments success:', res);
        resolve(res);
      },
      fail: (err) => {
        console.error('Share to moments failed:', err);
        reject(err);
      },
    });
  });
}

/**
 * 复制链接
 */
export function copyShareLink(vehicle: any) {
  const shareContent = generateShareContent(vehicle);
  const fullUrl = `https://your-domain.com${shareContent.path}`;

  uni.setClipboardData({
    data: fullUrl,
    success: () => {
      uni.showToast({
        title: '链接已复制',
        icon: 'success',
      });
    },
    fail: () => {
      uni.showToast({
        title: '复制失败',
        icon: 'error',
      });
    },
  });
}

/**
 * 生成分享海报
 */
export function generateSharePoster(vehicle: any): Promise<string> {
  return new Promise((resolve, reject) => {
    // 创建 canvas 上下文
    const ctx = uni.createCanvasContext('sharePoster');

    // 设置画布大小
    const canvasWidth = 750;
    const canvasHeight = 1200;

    try {
      // 绘制背景
      ctx.setFillStyle('#ffffff');
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // 绘制渐变背景
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, '#8860D0');
      gradient.addColorStop(1, '#a78bdb');
      ctx.setFillStyle(gradient);
      ctx.fillRect(0, 0, canvasWidth, 400);

      // 绘制车辆图片
      if (vehicle.images?.[0]) {
        ctx.drawImage(vehicle.images[0], 50, 50, 650, 350);
      }

      // 绘制标题
      ctx.setFillStyle('#333333');
      ctx.setFontSize(40);
      ctx.setTextAlign('center');
      ctx.fillText(vehicle.modelName, canvasWidth / 2, 500);

      // 绘制价格
      ctx.setFillStyle('#FF6B35');
      ctx.setFontSize(60);
      ctx.fillText(`¥${vehicle.dailyPrice}/天`, canvasWidth / 2, 600);

      // 绘制规格
      ctx.setFillStyle('#666666');
      ctx.setFontSize(32);
      ctx.fillText(`${vehicle.seatCount}座 ${vehicle.bedCount}床`, canvasWidth / 2, 660);

      // 绘制评分
      ctx.setFillStyle('#FFB800');
      ctx.fillText(`⭐ ${vehicle.rating}分`, canvasWidth / 2, 720);

      // 绘制小程序码（占位）
      ctx.setFillStyle('#f0f0f0');
      ctx.fillRect(275, 800, 200, 200);
      ctx.setFillStyle('#999999');
      ctx.setFontSize(24);
      ctx.fillText('小程序码', canvasWidth / 2, 900);

      // 绘制提示文字
      ctx.setFillStyle('#999999');
      ctx.setFontSize(28);
      ctx.fillText('长按识别小程序码', canvasWidth / 2, 1100);

      // 绘制
      ctx.draw(false, () => {
        // 导出图片
        uni.canvasToTempFilePath({
          canvasId: 'sharePoster',
          success: (res) => {
            resolve(res.tempFilePath);
          },
          fail: (err) => {
            console.error('Generate poster failed:', err);
            reject(err);
          },
        });
      });
    } catch (error) {
      console.error('Draw poster failed:', error);
      reject(error);
    }
  });
}

/**
 * 保存海报到相册
 */
export function savePosterToAlbum(posterPath: string) {
  uni.saveImageToPhotosAlbum({
    filePath: posterPath,
    success: () => {
      uni.showToast({
        title: '海报已保存到相册',
        icon: 'success',
      });
    },
    fail: (err) => {
      console.error('Save poster failed:', err);
      uni.showModal({
        title: '保存失败',
        content: '请检查相册权限设置',
        showCancel: false,
      });
    },
  });
}

/**
 * 分享菜单
 */
export function showShareMenu(vehicle: any) {
  uni.showActionSheet({
    itemList: ['微信好友', '朋友圈', '复制链接', '生成海报'],
    success: async (res) => {
      try {
        switch (res.tapIndex) {
          case 0:
            await shareToWechat(vehicle);
            uni.showToast({
              title: '分享成功',
              icon: 'success',
            });
            break;
          case 1:
            await shareToMoments(vehicle);
            uni.showToast({
              title: '分享成功',
              icon: 'success',
            });
            break;
          case 2:
            copyShareLink(vehicle);
            break;
          case 3:
            uni.showLoading({
              title: '正在生成海报...',
            });
            const posterPath = await generateSharePoster(vehicle);
            uni.hideLoading();
            savePosterToAlbum(posterPath);
            break;
        }
      } catch (error) {
        console.error('Share action failed:', error);
        uni.showToast({
          title: '分享失败，请重试',
          icon: 'error',
        });
      }
    },
  });
}