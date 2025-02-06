import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import {ExtractJwt, Strategy} from "passport-jwt"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor() {
        super({
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          ignoreExpiration: false,
          secretOrKey: 'THISISMYKEY',  // Thay bằng secret key của bạn
        });
      }

      async validate(payload: any) {
        return { idAccount: payload.idAccount, idUser: payload.idUser, email: payload.email, role: payload.role, phoneNumber: payload.phoneNumber };
      }

}