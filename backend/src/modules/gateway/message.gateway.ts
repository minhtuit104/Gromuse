import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagerService } from '../messager/messager.service';
import { JwtService } from '@nestjs/jwt';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwtAuthGuard/jwtAuthGuard';
import { UserService } from '../users/user.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Cho phép mọi nguồn truy cập
  },
})
export class MyGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messageService: MessagerService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  // Hàm này sẽ được gọi khi client kết nối
  @UseGuards(JwtAuthGuard)
  handleConnection(client: Socket) {
    try {
      //lấy token từ client
      const token = client.handshake.auth.token;
      if (!token) {
        throw new Error('Invalid token');
      }
      //Giải mã token lấy thông tin user
      const decodedToken = this.jwtService.verify(token);
      const idUser = decodedToken.idUser;
      client.data.idUser = idUser;
      console.log(`User ${idUser} connected`);
    } catch (error) {
      console.log('Invalid token', error);
      client.disconnect();
    }
  }

  // Hàm này sẽ được gọi khi client ngắt kết nối
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Thực hiện các hành động như xóa người dùng khỏi danh sách online
  }

  // Sự kiện gửi tin nhắn
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { receiverId: number; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data.idUser;
    console.log('data---------->: ', data);
    // // Lưu tin nhắn vào cơ sở dữ liệu
    const message = await this.messageService.createMessage(
      senderId,
      data.receiverId,
      data.content,
    );
    //gửi tin nhắn đến người nhận
    const receiverSocket = this.getSocketByUserId(data.receiverId);
    if (receiverSocket) {
      this.server.to(receiverSocket.id).emit('receiveMessage', message);
    }
  }

  //lấy socket theo id người dùng theo idUser
  getSocketByUserId(userId: number): Socket | undefined {
    return [...this.server.sockets.sockets.values()].find(
      (socket) => socket.data.idUser === userId,
    );
  }

  // Khi user tham gia room
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() userId: number,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`user_${userId}`);
    console.log(`User ${userId} joined room user_${userId}`);
  }
}
