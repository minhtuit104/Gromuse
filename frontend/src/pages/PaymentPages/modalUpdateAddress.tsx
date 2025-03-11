import React from "react";
import { Modal, Button } from "antd";
import { Formik, FormikProps } from "formik";
import TextInput from "../../components/TextInput/TextInput";

interface UpdateAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { name: string; phone: string; address: string }) => void;
}

const UpdateAddressModal: React.FC<UpdateAddressModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal
      title="Update Address"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      className="update-address-modal"
    >
      <div className="product-card-line"></div>
      <Formik
        initialValues={{ name: "", phone: "", address: "" }}
        onSubmit={(values) => {
          onConfirm(values);
        }}
      >
        {(
          formikProps: FormikProps<{
            name: string;
            phone: string;
            address: string;
          }>
        ) => (
          <form
            onSubmit={formikProps.handleSubmit}
            className="update-address-modal-form"
          >
            <div className="name_phone">
              {/* Input Name */}
              <TextInput
                label="Name"
                required
                placeholder="Enter your name"
                wrapperStyle="name-input-wrapper"
                value={formikProps.values.name}
                onChange={formikProps.handleChange("name")}
                onBlur={formikProps.handleBlur("name")}
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
                value={formikProps.values.phone}
                onChange={formikProps.handleChange("phone")}
                onBlur={formikProps.handleBlur("phone")}
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
              value={formikProps.values.address}
              onChange={formikProps.handleChange("address")}
              onBlur={formikProps.handleBlur("address")}
              error={
                formikProps.touched.address
                  ? formikProps.errors.address ?? ""
                  : ""
              }
            />
            {/* Buttons */}
            <div className="btn_updateAdress">
              <Button onClick={onClose}>Back</Button>
              <Button type="primary" htmlType="submit">
                Confirm
              </Button>
            </div>
          </form>
        )}
      </Formik>
    </Modal>
  );
};

export default UpdateAddressModal;
