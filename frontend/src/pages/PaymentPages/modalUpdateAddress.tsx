import React, { useEffect } from "react"; // *** Thêm useEffect ***
import { Modal, Button } from "antd";
import { Formik, FormikProps, useFormikContext, Form } from "formik";
import TextInput from "../../components/TextInput/TextInput";
import { AddressDto } from "../../dtos/address.dto";

interface UpdateAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { name: string; phone: string; address: string }) => void;
  initialData: AddressDto | null;
}

const FormikEffect = ({ initialData }: { initialData: AddressDto | null }) => {
  const { setValues } = useFormikContext<{
    name: string;
    phone: string;
    address: string;
  }>();

  useEffect(() => {
    if (initialData) {
      setValues({
        name: initialData.name || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
      });
    } else {
      // Nếu không có initialData, reset form
      setValues({ name: "", phone: "", address: "" });
    }
  }, [initialData, setValues]); // Chạy lại khi initialData hoặc setValues thay đổi

  return null; // Component này không render gì cả
};

const UpdateAddressModal: React.FC<UpdateAddressModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialData, // *** 2. Nhận prop initialData ***
}) => {
  return (
    <Modal
      title="Update Address"
      open={isOpen}
      onCancel={onClose}
      footer={null} // Footer sẽ được render bởi Formik
      centered
      className="update-address-modal"
      destroyOnClose // Reset Formik state khi modal đóng hoàn toàn
    >
      <div className="product-card-line"></div>
      <Formik
        // *** 3. Sử dụng initialData để đặt giá trị ban đầu cho Formik ***
        // Cung cấp giá trị mặc định nếu initialData là null
        initialValues={{
          name: initialData?.name || "",
          phone: initialData?.phone || "",
          address: initialData?.address || "",
        }}
        // Thêm validation nếu cần
        // validationSchema={...}
        onSubmit={(values) => {
          onConfirm(values);
        }}
        enableReinitialize
      >
        {(
          formikProps: FormikProps<{
            name: string;
            phone: string;
            address: string;
          }>
        ) => (
          <Form className="update-address-modal-form">
            {/* Component để xử lý cập nhật giá trị form khi initialData thay đổi */}
            {/* <FormikEffect initialData={initialData} /> */}

            <div className="name_phone">
              {/* Input Name */}
              <TextInput
                label="Name"
                required
                placeholder="Enter your name"
                wrapperStyle="name-input-wrapper"
                // Sử dụng các props của Formik để liên kết input
                name="name" // Thêm name
                value={formikProps.values.name}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={
                  formikProps.touched.name ? formikProps.errors.name ?? "" : ""
                }
              />
              {/* Input Phone */}
              <TextInput
                label="Phone number"
                required
                placeholder="Enter your phone number"
                wrapperStyle="phone-input-wrapper"
                name="phone" // Thêm name
                value={formikProps.values.phone}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                error={
                  formikProps.touched.phone
                    ? formikProps.errors.phone ?? ""
                    : ""
                }
              />
            </div>
            {/* Input Address */}
            <TextInput
              label="Address"
              required
              placeholder="Enter your address"
              wrapperStyle="address-input-wrapper"
              name="address" // Thêm name
              value={formikProps.values.address}
              onChange={formikProps.handleChange}
              onBlur={formikProps.handleBlur}
              error={
                formikProps.touched.address
                  ? formikProps.errors.address ?? ""
                  : ""
              }
            />
            {/* Buttons */}
            <div className="btn_updateAdress">
              <Button onClick={onClose}>Back</Button>
              <Button
                type="primary"
                htmlType="submit" // htmlType="submit" để kích hoạt onSubmit của Formik
                disabled={formikProps.isSubmitting} // Disable nút khi đang submit
              >
                Confirm
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};

export default UpdateAddressModal;
