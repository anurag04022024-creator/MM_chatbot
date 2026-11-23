"""File Upload Component for Streamlit."""

from typing import Tuple, Optional
import streamlit as st
from streamlit_app.api_client import APIClient


def render_multimodal_uploader(api_client: APIClient) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Renders upload widgets for images, audio, and documents.
    Returns:
        (image_file_id, audio_file_id, document_file_id)
    """
    st.subheader("📎 Multimodal Attachments")

    col1, col2 = st.columns(2)

    image_file_id = None
    audio_file_id = None

    with col1:
        img_upload = st.file_uploader(
            "Upload Image",
            type=["png", "jpg", "jpeg", "webp"],
            help="Supported: PNG, JPG, JPEG, WEBP (Max 10MB)",
            key="img_uploader",
        )
        if img_upload is not None:
            st.image(img_upload, caption=img_upload.name, use_container_width=True)
            if "last_uploaded_img_name" not in st.session_state or st.session_state.last_uploaded_img_name != img_upload.name:
                try:
                    with st.spinner("Validating and uploading image..."):
                        res = api_client.upload_file(img_upload.name, img_upload.getvalue())
                        st.session_state.uploaded_img_id = res["file_id"]
                        st.session_state.last_uploaded_img_name = img_upload.name
                        st.success(f"Image uploaded! ID: `{res['file_id'][:8]}...`")
                except Exception as exc:
                    st.error(f"Image upload failed: {exc}")

            image_file_id = st.session_state.get("uploaded_img_id")

    with col2:
        audio_upload = st.file_uploader(
            "Upload Audio / Voice Note",
            type=["mp3", "wav", "m4a"],
            help="Supported: MP3, WAV, M4A (Max 10MB)",
            key="audio_uploader",
        )
        if audio_upload is not None:
            st.audio(audio_upload)
            if "last_uploaded_audio_name" not in st.session_state or st.session_state.last_uploaded_audio_name != audio_upload.name:
                try:
                    with st.spinner("Validating and uploading audio..."):
                        res = api_client.upload_file(audio_upload.name, audio_upload.getvalue())
                        st.session_state.uploaded_audio_id = res["file_id"]
                        st.session_state.last_uploaded_audio_name = audio_upload.name
                        st.success(f"Audio uploaded! ID: `{res['file_id'][:8]}...`")
                except Exception as exc:
                    st.error(f"Audio upload failed: {exc}")

            audio_file_id = st.session_state.get("uploaded_audio_id")

    return image_file_id, audio_file_id, None
