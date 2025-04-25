import React, { useState } from "react";
import { Modal, Button } from "antd";
import { Formik, FormikProps, Form } from "formik";
import TextInput from "../../components/TextInput/TextInput";
import { AddressDto } from "../../dtos/address.dto";
import * as Yup from "yup";

interface UpdateAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { name: string; phone: string; address: string }) => void;
  initialData: AddressDto | null;
  isLoading?: boolean;
}

const UpdateAddressModal: React.FC<UpdateAddressModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialData,
  isLoading = false,
}) => {
  const [submitting, setSubmitting] = useState(false);

  const validationSchema = Yup.object({
    name: Yup.string().required("Name is required!"),
    phone: Yup.string()
      .required("Phone is required!")
      .matches(/^[0-9]+$/, "Phone must contain only numbers"),
    address: Yup.string().required("Address is required!"),
  });

  const handleSubmit = async (values: {
    name: string;
    phone: string;
    address: string;
  }) => {
    try {
      setSubmitting(true);
      await onConfirm(values);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Update Address"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      className="update-address-modal"
      destroyOnClose
      maskClosable={!isLoading && !submitting}
      closable={!isLoading && !submitting}
    >
      <div className="product-card-line"></div>
      <Formik
        initialValues={{
          name: initialData?.name || "",
          phone: initialData?.phone || "",
          address: initialData?.address || "",
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
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
            <div className="name_phone">
              <TextInput
                label="Name"
                required
                placeholder="Enter your name"
                wrapperStyle="name-input-wrapper"
                name="name"
                value={formikProps.values.name}
                onChange={(value) => formikProps.setFieldValue("name", value)}
                onBlur={formikProps.handleBlur}
                error={
                  formikProps.touched.name ? formikProps.errors.name ?? "" : ""
                }
                disabled={isLoading || submitting}
              />
              {/* Input Phone */}
              <TextInput
                label="Phone number"
                required
                placeholder="Enter your phone number"
                wrapperStyle="phone-input-wrapper"
                name="phone"
                value={formikProps.values.phone}
                onChange={(value) => formikProps.setFieldValue("phone", value)}
                onBlur={formikProps.handleBlur}
                error={
                  formikProps.touched.phone
                    ? formikProps.errors.phone ?? ""
                    : ""
                }
                disabled={isLoading || submitting}
              />
            </div>
            {/* Input Address */}
            <TextInput
              label="Address"
              required
              placeholder="Enter your address"
              wrapperStyle="address-input-wrapper"
              name="address"
              value={formikProps.values.address}
              onChange={(value) => formikProps.setFieldValue("address", value)}
              onBlur={formikProps.handleBlur}
              error={
                formikProps.touched.address
                  ? formikProps.errors.address ?? ""
                  : ""
              }
              disabled={isLoading || submitting}
            />
            {/* Buttons */}
            <div className="btn_updateAdress">
              <Button onClick={onClose} disabled={isLoading || submitting}>
                Back
              </Button>
              <Button
                onClick={() => formikProps.handleSubmit()}
                type="primary"
                htmlType="submit"
                disabled={isLoading || submitting || !formikProps.isValid}
                loading={isLoading || submitting}
              >
                {isLoading || submitting ? "Updating..." : "Confirm"}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};

export default UpdateAddressModal;
