import { UnauthorizedException } from '@nestjs/common';

const getUserFromReq = (req) => {
  const user = req?.user;
  if (!user) throw new UnauthorizedException('Пользователь не авторизован');
  return user;
};
export default getUserFromReq;
