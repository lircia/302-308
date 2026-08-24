/**
 * 访问域名 -> 重定向 URL
 *
 * key 只填写域名，不填写协议、端口或路径；匹配时不区分大小写，
 * 访问域名末尾的点也会自动忽略。
 */
export const REDIRECTS: Record<string, string> = {
  // 'aaa.sa.sia': 'https://destination.example.com',
};

/**
 * 302 适合临时转发；如果需要永久转发可改为 301。
 */
export const REDIRECT_STATUS = 302;
